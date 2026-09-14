import { CityEntity, CityQueryNode } from './cityTypes';
import { CityExecutionResult } from './cityQueries';

export interface TableScanMetrics {
  executionTimeMs: number;
  rowsScanned: number;
  matchingRows: number;
}

export interface CityBenchmarkComparison {
  tableScan: TableScanMetrics;
  bitmap: CityExecutionResult;
  speedup: number;
}

// Helper to evaluate a condition on a row
function evaluateCondition(row: CityEntity, node: CityQueryNode): boolean {
  if (node.type === 'predicate') {
    const rowVal = String(row[node.column]);
    if (node.operator === '=') return rowVal === node.value;
    if (node.operator === '!=') return rowVal !== node.value;
    return false;
  }
  
  if (node.type === 'not') {
    return !evaluateCondition(row, node.operand);
  }
  
  if (node.type === 'logical') {
    const left = evaluateCondition(row, node.left);
    const right = evaluateCondition(row, node.right);
    if (node.operator === 'AND') return left && right;
    if (node.operator === 'OR') return left || right;
    if (node.operator === 'XOR') return (left || right) && !(left && right);
  }
  
  return false;
}

export function executeTableScan(ast: CityQueryNode, dataset: CityEntity[]): TableScanMetrics {
  const start = performance.now();
  let matchCount = 0;
  
  // Standard full table scan
  for (let i = 0; i < dataset.length; i++) {
    if (evaluateCondition(dataset[i], ast)) {
      matchCount++;
    }
  }
  
  const end = performance.now();
  
  return {
    executionTimeMs: end - start,
    rowsScanned: dataset.length,
    matchingRows: matchCount
  };
}

export function benchmarkCityQuery(
  ast: CityQueryNode, 
  dataset: CityEntity[], 
  bitmapResult: CityExecutionResult
): CityBenchmarkComparison {
  // Warmup run for JIT
  executeTableScan(ast, dataset);
  
  // Actual measurement run
  const tableScanResult = executeTableScan(ast, dataset);
  
  // To avoid divide by zero if bitmap is literally 0.00ms (too fast for performance.now precision)
  const safeBitmapTime = Math.max(bitmapResult.metrics.executionTimeMs, 0.01);
  const speedup = tableScanResult.executionTimeMs / safeBitmapTime;
  
  return {
    tableScan: tableScanResult,
    bitmap: bitmapResult,
    speedup: Number(speedup.toFixed(2))
  };
}
