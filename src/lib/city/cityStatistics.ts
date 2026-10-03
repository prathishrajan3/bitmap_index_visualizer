import { CityEntity, CityBitmapIndex, CityQueryNode } from './cityTypes';
import { executeCityQuery, CityExecutionResult } from './cityQueries';

export interface TableScanMetrics {
  executionTimeMs: number;
  rowsScanned: number;
  predicateChecks: number;
  matchingRows: number;
  matchingIds: string[];
}

export interface CityBenchmarkStatistics {
  totalRows: number;
  matchingRows: number;
  tableScanRowsScanned: number;
  tableScanPredicateChecks: number;
  bitmapVectorsUsed: number;
  bitmapOperations: number;
  bitmapCandidateRows: number;
  rowsAvoided: number;
  rowReductionPct: number;
  tableScanMedianMs: number;
  bitmapMedianMs: number;
  tableScanAverageMs: number;
  bitmapAverageMs: number;
  tableScanP95Ms: number;
  bitmapP95Ms: number;
  speedup: number | null;
  resultSetsEqual: boolean;
}

// Helper to evaluate a condition on a row
function evaluateCondition(row: CityEntity, node: CityQueryNode, checks: { count: number }): boolean {
  if (node.type === 'predicate') {
    checks.count++;
    const rowVal = String(row[node.column]);
    if (node.operator === '=') return rowVal === node.value;
    if (node.operator === '!=') return rowVal !== node.value;
    return false;
  }
  
  if (node.type === 'not') {
    return !evaluateCondition(row, node.operand, checks);
  }
  
  if (node.type === 'logical') {
    const left = evaluateCondition(row, node.left, checks);
    
    // Short circuiting logic for accurate predicate checks simulation
    if (node.operator === 'AND' && !left) return false;
    if (node.operator === 'OR' && left) return true;
    
    const right = evaluateCondition(row, node.right, checks);
    if (node.operator === 'AND') return left && right;
    if (node.operator === 'OR') return left || right;
    if (node.operator === 'XOR') return (left || right) && !(left && right);
  }
  
  return false;
}

export function executeTableScan(ast: CityQueryNode, dataset: CityEntity[]): TableScanMetrics {
  const start = performance.now();
  const matchingIds: string[] = [];
  const checks = { count: 0 };
  
  // Standard full table scan
  for (let i = 0; i < dataset.length; i++) {
    if (evaluateCondition(dataset[i], ast, checks)) {
      matchingIds.push(dataset[i].id);
    }
  }
  
  const end = performance.now();
  
  return {
    executionTimeMs: end - start,
    rowsScanned: dataset.length,
    predicateChecks: checks.count,
    matchingRows: matchingIds.length,
    matchingIds
  };
}

// Math helpers
function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

export function runRepeatedCityBenchmark(
  ast: CityQueryNode, 
  dataset: CityEntity[], 
  bitmapIndex: CityBitmapIndex,
  warmupIterations = 5,
  measureIterations = 15
): CityBenchmarkStatistics {
  
  const datasetIds = dataset.map(e => e.id);
  
  // Run warmups
  for (let i = 0; i < warmupIterations; i++) {
    executeTableScan(ast, dataset);
    executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
  }
  
  const tableScanTimes: number[] = [];
  const bitmapTimes: number[] = [];
  
  let lastTableScanResult: TableScanMetrics | null = null;
  let lastBitmapResult: CityExecutionResult | null = null;

  // Measurement
  for (let i = 0; i < measureIterations; i++) {
    // Alternate execution order to reduce JIT/GC bias
    if (i % 2 === 0) {
      lastTableScanResult = executeTableScan(ast, dataset);
      tableScanTimes.push(lastTableScanResult.executionTimeMs);
      
      lastBitmapResult = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
      bitmapTimes.push(lastBitmapResult.metrics.executionTimeMs);
    } else {
      lastBitmapResult = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
      bitmapTimes.push(lastBitmapResult.metrics.executionTimeMs);
      
      lastTableScanResult = executeTableScan(ast, dataset);
      tableScanTimes.push(lastTableScanResult.executionTimeMs);
    }
  }

  // Fallback if no iterations (shouldn't happen)
  if (!lastTableScanResult) lastTableScanResult = executeTableScan(ast, dataset);
  if (!lastBitmapResult) lastBitmapResult = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);

  // Result Set Correctness Validation
  const tableScanSortedIds = [...lastTableScanResult.matchingIds].sort();
  const bitmapSortedIds = [...lastBitmapResult.matchingIds].sort();
  const resultSetsEqual = 
    tableScanSortedIds.length === bitmapSortedIds.length &&
    tableScanSortedIds.every((id, index) => id === bitmapSortedIds[index]);

  // Aggregate Stats
  const tableScanMedian = median(tableScanTimes);
  const bitmapMedian = median(bitmapTimes);
  
  const matchingRows = lastTableScanResult.matchingRows;
  const rowsAvoided = dataset.length - matchingRows;
  const rowReductionPct = (rowsAvoided / dataset.length) * 100;

  // Calculate speedup without artificial inflation. 
  // If bitmap takes 0ms (below timer precision), speedup calculation is theoretically infinite.
  // We'll bound it sensibly or return null if not meaningful.
  const speedup = bitmapMedian > 0.005 ? (tableScanMedian / bitmapMedian) : null;

  return {
    totalRows: dataset.length,
    matchingRows: matchingRows,
    tableScanRowsScanned: lastTableScanResult.rowsScanned,
    tableScanPredicateChecks: lastTableScanResult.predicateChecks,
    bitmapVectorsUsed: lastBitmapResult.metrics.bitmapVectorsUsed,
    bitmapOperations: lastBitmapResult.metrics.operationsPerformed.length,
    bitmapCandidateRows: lastBitmapResult.metrics.matchingRows, // from setBitCount
    rowsAvoided,
    rowReductionPct,
    tableScanMedianMs: tableScanMedian,
    bitmapMedianMs: bitmapMedian,
    tableScanAverageMs: average(tableScanTimes),
    bitmapAverageMs: average(bitmapTimes),
    tableScanP95Ms: percentile(tableScanTimes, 95),
    bitmapP95Ms: percentile(bitmapTimes, 95),
    speedup,
    resultSetsEqual
  };
}
