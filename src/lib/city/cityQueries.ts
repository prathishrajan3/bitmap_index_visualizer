import { Bitmap } from '@/lib/bitmap/types';
import { CityBitmapIndex, CityQueryNode, AIStructuredCityQuery } from './cityTypes';
import { bitmapAnd, bitmapOr, bitmapXor, bitmapNot } from '@/lib/bitmap/operations';
import { countSetBits, calculateDensity } from '@/lib/bitmap/statistics';
import { createEmptyCityBitmap, createFullCityBitmap } from './cityBitmapEngine';

export interface CityExecutionMetrics {
  bitmapVectorsUsed: number;
  operationsPerformed: string[];
  executionTimeMs: number;
  matchingRows: number;
  rowsScanned: number; // for comparison (simulated naive execution)
}

export interface CityExecutionStep {
  node: CityQueryNode;
  resultBitmap: Bitmap;
  description: string;
}

export interface CityExecutionResult {
  finalBitmap: Bitmap;
  metrics: CityExecutionMetrics;
  steps: CityExecutionStep[];
  matchingIds: string[]; // If we map bits back to entity IDs
}

// Wrapper to cast operations array to Bitmap object
function wrapOp(op: (a: number[], b: number[]) => number[], a: Bitmap, b: Bitmap, desc: string): Bitmap {
  const resultBits = op(a.bits, b.bits);
  return {
    bits: resultBits,
    length: resultBits.length,
    setBitCount: countSetBits(resultBits),
    density: calculateDensity(resultBits),
    sourceColumn: 'synthetic_city',
    sourceValue: desc
  };
}

function wrapUnaryOp(op: (a: number[]) => number[], a: Bitmap, desc: string): Bitmap {
  const resultBits = op(a.bits);
  return {
    bits: resultBits,
    length: resultBits.length,
    setBitCount: countSetBits(resultBits),
    density: calculateDensity(resultBits),
    sourceColumn: 'synthetic_city',
    sourceValue: desc
  };
}

export function executeCityQuery(
  ast: CityQueryNode,
  index: CityBitmapIndex,
  datasetSize: number,
  datasetIds: string[]
): CityExecutionResult {
  const start = performance.now();
  const metrics: CityExecutionMetrics = {
    bitmapVectorsUsed: 0,
    operationsPerformed: [],
    executionTimeMs: 0,
    matchingRows: 0,
    rowsScanned: datasetSize // A naive table scan would check all rows
  };
  const steps: CityExecutionStep[] = [];

  function evaluate(node: CityQueryNode): Bitmap {
    if (node.type === 'predicate') {
      const fieldIndex = index[node.column];
      if (!fieldIndex) {
        return createEmptyCityBitmap(datasetSize);
      }

      if (node.operator === '=') {
        const bitmap = fieldIndex[node.value] || createEmptyCityBitmap(datasetSize);
        metrics.bitmapVectorsUsed++;
        steps.push({ node, resultBitmap: bitmap, description: `Lookup ${node.column} = ${node.value}` });
        return bitmap;
      } else if (node.operator === '!=') {
        const bitmap = fieldIndex[node.value] || createEmptyCityBitmap(datasetSize);
        metrics.bitmapVectorsUsed++;
        metrics.operationsPerformed.push('NOT');
        const inverted = wrapUnaryOp(bitmapNot, bitmap, `Lookup ${node.column} != ${node.value}`);
        steps.push({ node, resultBitmap: inverted, description: `Lookup ${node.column} != ${node.value} (NOT)` });
        return inverted;
      }
      return createEmptyCityBitmap(datasetSize);
    } else if (node.type === 'not') {
      const operand = evaluate(node.operand);
      const result = wrapUnaryOp(bitmapNot, operand, 'Logical NOT');
      metrics.operationsPerformed.push('NOT');
      steps.push({ node, resultBitmap: result, description: 'Logical NOT' });
      return result;
    } else if (node.type === 'logical') {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      
      let result: Bitmap;
      if (node.operator === 'AND') {
        result = wrapOp(bitmapAnd, left, right, 'Logical AND');
        metrics.operationsPerformed.push('AND');
      } else if (node.operator === 'OR') {
        result = wrapOp(bitmapOr, left, right, 'Logical OR');
        metrics.operationsPerformed.push('OR');
      } else if (node.operator === 'XOR') {
        result = wrapOp(bitmapXor, left, right, 'Logical XOR');
        metrics.operationsPerformed.push('XOR');
      } else {
        result = createEmptyCityBitmap(datasetSize);
      }

      steps.push({ node, resultBitmap: result, description: `Logical ${node.operator}` });
      return result;
    }
    
    return createEmptyCityBitmap(datasetSize);
  }

  const finalBitmap = evaluate(ast);
  
  // Extract matching IDs
  const matchingIds: string[] = [];
  for (let i = 0; i < finalBitmap.length; i++) {
    if (finalBitmap.bits[i] === 1) {
      matchingIds.push(datasetIds[i]);
    }
  }

  const end = performance.now();
  metrics.executionTimeMs = end - start;
  metrics.matchingRows = finalBitmap.setBitCount;

  return { finalBitmap, metrics, steps, matchingIds };
}

// Convert the loose AI JSON structure to our strict AST, validating fields.
export function parseAICityQuery(aiQuery: any, validFields: Set<string>): CityQueryNode {
  if (!aiQuery || typeof aiQuery !== 'object') {
    throw new Error("Invalid AI Query structure");
  }

  // First check if it's a leaf node (predicate)
  if (aiQuery.column && aiQuery.value !== undefined) {
    if (!validFields.has(aiQuery.column)) {
      throw new Error(`Invalid column: ${aiQuery.column}`);
    }
    const op = aiQuery.operator || '=';
    if (op !== '=' && op !== '!=') {
      throw new Error(`Invalid predicate operator: ${op}`);
    }
    return {
      type: 'predicate',
      column: aiQuery.column as any,
      operator: op as any,
      value: String(aiQuery.value)
    };
  }

  // Otherwise it must be a logical node
  if (aiQuery.operator) {
    if (aiQuery.operator === 'NOT') {
      if (!Array.isArray(aiQuery.conditions) || aiQuery.conditions.length !== 1) {
        throw new Error("NOT operator must have exactly 1 condition");
      }
      return {
        type: 'not',
        operand: parseAICityQuery(aiQuery.conditions[0], validFields)
      };
    } else if (aiQuery.operator === 'AND' || aiQuery.operator === 'OR' || aiQuery.operator === 'XOR') {
      if (!Array.isArray(aiQuery.conditions) || aiQuery.conditions.length < 2) {
        throw new Error(`${aiQuery.operator} operator requires at least 2 conditions`);
      }
      
      // Reduce multiple conditions into a binary tree
      const parsedConditions = aiQuery.conditions.map((c: any) => parseAICityQuery(c, validFields));
      
      let rootNode: CityQueryNode = parsedConditions[0];
      for (let i = 1; i < parsedConditions.length; i++) {
        rootNode = {
          type: 'logical',
          operator: aiQuery.operator,
          left: rootNode,
          right: parsedConditions[i]
        };
      }
      return rootNode;
    }
    throw new Error(`Unknown operator: ${aiQuery.operator}`);
  }

  throw new Error("Could not parse query node");
}
