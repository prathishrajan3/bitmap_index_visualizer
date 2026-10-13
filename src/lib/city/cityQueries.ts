import { Bitmap } from '@/lib/bitmap/types';
import { CityBitmapIndex, CityQueryNode, AIStructuredCityQuery } from './cityTypes';
import { 
  CityPackedBitmap, 
  createEmptyPackedBitmap, 
  createFullPackedBitmap,
  packedBitmapAnd, 
  packedBitmapOr, 
  packedBitmapXor, 
  packedBitmapNot,
  extractPackedMatchingIds
} from './packedBitmap';

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
  matchingIds: string[];
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
    rowsScanned: datasetSize
  };
  const steps: CityExecutionStep[] = [];

  function evaluate(node: CityQueryNode): CityPackedBitmap {
    if (node.type === 'predicate') {
      const fieldIndex = index[node.column];
      if (!fieldIndex) {
        const empty = createEmptyPackedBitmap(datasetSize);
        steps.push({ node, resultBitmap: empty, description: `Missing index for ${node.column}` });
        return empty;
      }

      const rawBitmap = fieldIndex[node.value];
      const bitmap = (rawBitmap instanceof CityPackedBitmap)
        ? rawBitmap
        : (rawBitmap ? new CityPackedBitmap(datasetSize, (rawBitmap as any).words || (rawBitmap as any).bits, node.column, node.value) : createEmptyPackedBitmap(datasetSize));

      metrics.bitmapVectorsUsed++;

      if (node.operator === '=') {
        steps.push({ node, resultBitmap: bitmap, description: `Lookup ${node.column} = ${node.value}` });
        return bitmap;
      } else if (node.operator === '!=') {
        metrics.operationsPerformed.push('NOT');
        const inverted = packedBitmapNot(bitmap);
        inverted.sourceColumn = node.column;
        inverted.sourceValue = `!= ${node.value}`;
        steps.push({ node, resultBitmap: inverted, description: `Lookup ${node.column} != ${node.value} (NOT)` });
        return inverted;
      }
      return createEmptyPackedBitmap(datasetSize);
    } else if (node.type === 'not') {
      const operand = evaluate(node.operand);
      metrics.operationsPerformed.push('NOT');
      const result = packedBitmapNot(operand);
      result.sourceColumn = 'derived';
      result.sourceValue = 'NOT';
      steps.push({ node, resultBitmap: result, description: 'Logical NOT' });
      return result;
    } else if (node.type === 'logical') {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      
      let result: CityPackedBitmap;
      if (node.operator === 'AND') {
        result = packedBitmapAnd(left, right);
        metrics.operationsPerformed.push('AND');
      } else if (node.operator === 'OR') {
        result = packedBitmapOr(left, right);
        metrics.operationsPerformed.push('OR');
      } else if (node.operator === 'XOR') {
        result = packedBitmapXor(left, right);
        metrics.operationsPerformed.push('XOR');
      } else {
        result = createEmptyPackedBitmap(datasetSize);
      }

      result.sourceColumn = 'derived';
      result.sourceValue = `Logical ${node.operator}`;
      steps.push({ node, resultBitmap: result, description: `Logical ${node.operator}` });
      return result;
    }
    
    return createEmptyPackedBitmap(datasetSize);
  }

  const finalBitmap = evaluate(ast);
  
  // Fast word-level matching ID extraction
  const matchingIds = extractPackedMatchingIds(finalBitmap.words, datasetSize, datasetIds);

  const end = performance.now();
  metrics.executionTimeMs = end - start;
  metrics.matchingRows = matchingIds.length;

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
