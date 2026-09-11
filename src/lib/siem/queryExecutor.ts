import { QueryNode, QueryPredicate, SiemBitmapIndex } from './types';
import { Bitmap } from '@/lib/bitmap/types';
import { bitmapAnd, bitmapOr, bitmapNot } from '@/lib/bitmap/operations';

import { countSetBits, calculateDensity } from '@/lib/bitmap/statistics';

export interface ExecutionMetrics {
  bitmapVectorsUsed: number;
  operationsPerformed: string[];
  executionTimeMs: number;
  matchingRows: number;
  rowsScanned: number; // for table scan comparison
  tableScanChecks: number;
}

function wrapBitmapOp(op: (a: number[], b: number[]) => number[], bitmapA: Bitmap, bitmapB: Bitmap, description?: string): Bitmap {
  const bitsA = bitmapA.bits;
  const bitsB = bitmapB.bits;
  const resultBits = op(bitsA, bitsB);
  
  return {
    bits: resultBits,
    length: resultBits.length,
    setBitCount: countSetBits(resultBits),
    density: calculateDensity(resultBits),
    sourceColumn: 'synthetic',
    sourceValue: description || 'operation_result'
  };
}

function wrapBitmapUnaryOp(op: (a: number[]) => number[], bitmapA: Bitmap, description?: string): Bitmap {
  const bitsA = bitmapA.bits;
  const resultBits = op(bitsA);
  
  return {
    bits: resultBits,
    length: resultBits.length,
    setBitCount: countSetBits(resultBits),
    density: calculateDensity(resultBits),
    sourceColumn: 'synthetic',
    sourceValue: description || 'operation_result'
  };
}

export interface ExecutionResult {
  finalBitmap: Bitmap;
  metrics: ExecutionMetrics;
  evaluationSteps: { node: QueryNode; resultBitmap: Bitmap; description: string }[];
}

export function executeSiemQuery(ast: QueryNode, index: SiemBitmapIndex, rowCount: number): ExecutionResult {
  const startTime = performance.now();
  
  const metrics: ExecutionMetrics = {
    bitmapVectorsUsed: 0,
    operationsPerformed: [],
    executionTimeMs: 0,
    matchingRows: 0,
    rowsScanned: rowCount,
    tableScanChecks: 0
  };

  const steps: { node: QueryNode; resultBitmap: Bitmap; description: string }[] = [];

  function evaluate(node: QueryNode): Bitmap {
    if (node.type === 'predicate') {
      const pred = node as QueryPredicate;
      metrics.tableScanChecks++; // Base estimate
      
      const fieldIndex = index[pred.field];
      if (!fieldIndex) {
        // Field not indexed. Return an empty bitmap of correct length to fail gracefully.
        return createEmptyBitmap(rowCount);
      }

      if (pred.operator === '=') {
        const value = pred.value as string;
        const bitmap = fieldIndex[value];
        if (bitmap) {
          metrics.bitmapVectorsUsed++;
          steps.push({ node, resultBitmap: bitmap, description: `Lookup ${pred.field} = '${value}'` });
          return bitmap;
        } else {
          return createEmptyBitmap(rowCount);
        }
      } else if (pred.operator === '!=') {
        const value = pred.value as string;
        const bitmap = fieldIndex[value] || createEmptyBitmap(rowCount);
        metrics.bitmapVectorsUsed++;
        metrics.operationsPerformed.push('NOT');
        const result = wrapBitmapUnaryOp(bitmapNot, bitmap);
        steps.push({ node, resultBitmap: result, description: `Lookup ${pred.field} != '${value}' (NOT)` });
        return result;
      } else if (pred.operator === 'IN') {
        const values = pred.value as string[];
        let result = createEmptyBitmap(rowCount);
        for (const v of values) {
          if (fieldIndex[v]) {
            metrics.bitmapVectorsUsed++;
            if (result.setBitCount === 0) {
              result = fieldIndex[v]; // First one
            } else {
              result = wrapBitmapOp(bitmapOr, result, fieldIndex[v]);
              metrics.operationsPerformed.push('OR');
            }
          }
        }
        steps.push({ node, resultBitmap: result, description: `Lookup ${pred.field} IN (${values.join(', ')}) (OR)` });
        return result;
      } else if (pred.operator === 'NOT IN') {
        const values = pred.value as string[];
        let temp = createEmptyBitmap(rowCount);
        for (const v of values) {
          if (fieldIndex[v]) {
            metrics.bitmapVectorsUsed++;
            if (temp.setBitCount === 0) {
              temp = fieldIndex[v];
            } else {
              temp = wrapBitmapOp(bitmapOr, temp, fieldIndex[v]);
              metrics.operationsPerformed.push('OR');
            }
          }
        }
        const result = wrapBitmapUnaryOp(bitmapNot, temp);
        metrics.operationsPerformed.push('NOT');
        steps.push({ node, resultBitmap: result, description: `Lookup ${pred.field} NOT IN (${values.join(', ')})` });
        return result;
      }

      return createEmptyBitmap(rowCount);
    } else if (node.type === 'logical') {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      
      let result: Bitmap;
      if (node.operator === 'AND') {
        result = wrapBitmapOp(bitmapAnd, left, right);
        metrics.operationsPerformed.push('AND');
      } else {
        result = wrapBitmapOp(bitmapOr, left, right);
        metrics.operationsPerformed.push('OR');
      }
      
      steps.push({ node, resultBitmap: result, description: `Logical ${node.operator}` });
      return result;
    } else if (node.type === 'not') {
      const operand = evaluate(node.operand);
      const result = wrapBitmapUnaryOp(bitmapNot, operand);
      metrics.operationsPerformed.push('NOT');
      steps.push({ node, resultBitmap: result, description: `Logical NOT` });
      return result;
    }
    
    return createEmptyBitmap(rowCount);
  }

  const finalBitmap = evaluate(ast);
  
  metrics.matchingRows = finalBitmap.setBitCount;
  metrics.executionTimeMs = performance.now() - startTime;
  
  // A rough table scan heuristic for comparison
  const astDepth = getAstDepth(ast);
  metrics.tableScanChecks = rowCount * astDepth;

  return { finalBitmap, metrics, evaluationSteps: steps };
}

function createEmptyBitmap(length: number): Bitmap {
  return {
    bits: new Array(length).fill(0),
    length,
    setBitCount: 0,
    density: 0,
    sourceColumn: 'synthetic',
    sourceValue: 'empty'
  };
}

function getAstDepth(node: QueryNode): number {
  if (node.type === 'predicate') return 1;
  if (node.type === 'logical') return getAstDepth(node.left) + getAstDepth(node.right);
  if (node.type === 'not') return getAstDepth(node.operand);
  return 1;
}
