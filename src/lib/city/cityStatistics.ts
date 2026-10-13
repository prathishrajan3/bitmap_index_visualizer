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
  winner: 'bitmap' | 'table_scan' | 'tie';
  indexBuildTimeMs?: number;
  breakEvenQueries?: number | null;
  indexMemoryBytes?: number;
}

/**
 * Fast predicate evaluator for Table Scan with realistic short-circuiting.
 */
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
    
    // Short-circuiting logic
    if (node.operator === 'AND' && !left) return false;
    if (node.operator === 'OR' && left) return true;
    
    const right = evaluateCondition(row, node.right, checks);
    if (node.operator === 'AND') return left && right;
    if (node.operator === 'OR') return left || right;
    if (node.operator === 'XOR') return (left || right) && !(left && right);
  }
  
  return false;
}

/**
 * Executes a conventional Table Scan with predicate check count.
 */
export function executeTableScan(ast: CityQueryNode, dataset: CityEntity[]): TableScanMetrics {
  const start = performance.now();
  const matchingIds: string[] = [];
  const checks = { count: 0 };
  const len = dataset.length;
  
  for (let i = 0; i < len; i++) {
    if (evaluateCondition(dataset[i], ast, checks)) {
      matchingIds.push(dataset[i].id);
    }
  }
  
  const end = performance.now();
  
  return {
    executionTimeMs: end - start,
    rowsScanned: len,
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

/**
 * Runs repeated benchmark executions comparing Table Scan vs. Bitmap Index.
 * Uses warm-ups, alternating execution order, and adaptive batching for timer stability.
 */
export function runRepeatedCityBenchmark(
  ast: CityQueryNode, 
  dataset: CityEntity[], 
  bitmapIndex: CityBitmapIndex,
  warmupIterations = 5,
  measureIterations = 15,
  indexBuildTimeMs?: number,
  indexMemoryBytes?: number
): CityBenchmarkStatistics {
  
  const datasetIds = dataset.map(e => e.id);
  const totalRows = dataset.length;

  // Adaptive batching for sub-millisecond timer resolution
  // Small datasets run so quickly that single runs hit browser timer jitter.
  const batchSize = totalRows <= 5000 ? 10 : totalRows <= 20000 ? 5 : 1;

  // 1. Warm-up executions (not timed)
  for (let i = 0; i < warmupIterations; i++) {
    executeTableScan(ast, dataset);
    executeCityQuery(ast, bitmapIndex, totalRows, datasetIds);
  }
  
  const tableScanTimes: number[] = [];
  const bitmapTimes: number[] = [];
  
  let lastTableScanResult: TableScanMetrics | null = null;
  let lastBitmapResult: CityExecutionResult | null = null;

  // 2. Timed measurement with counter-balanced alternating order
  for (let i = 0; i < measureIterations; i++) {
    if (i % 2 === 0) {
      // Table Scan first
      const tsStart = performance.now();
      for (let b = 0; b < batchSize; b++) {
        lastTableScanResult = executeTableScan(ast, dataset);
      }
      const tsTime = (performance.now() - tsStart) / batchSize;
      tableScanTimes.push(tsTime);

      // Bitmap second
      const bmStart = performance.now();
      for (let b = 0; b < batchSize; b++) {
        lastBitmapResult = executeCityQuery(ast, bitmapIndex, totalRows, datasetIds);
      }
      const bmTime = (performance.now() - bmStart) / batchSize;
      bitmapTimes.push(bmTime);
    } else {
      // Bitmap first
      const bmStart = performance.now();
      for (let b = 0; b < batchSize; b++) {
        lastBitmapResult = executeCityQuery(ast, bitmapIndex, totalRows, datasetIds);
      }
      const bmTime = (performance.now() - bmStart) / batchSize;
      bitmapTimes.push(bmTime);

      // Table Scan second
      const tsStart = performance.now();
      for (let b = 0; b < batchSize; b++) {
        lastTableScanResult = executeTableScan(ast, dataset);
      }
      const tsTime = (performance.now() - tsStart) / batchSize;
      tableScanTimes.push(tsTime);
    }
  }

  // Safety fallback
  if (!lastTableScanResult) lastTableScanResult = executeTableScan(ast, dataset);
  if (!lastBitmapResult) lastBitmapResult = executeCityQuery(ast, bitmapIndex, totalRows, datasetIds);

  // 3. Strict result set equivalence verification
  const tsIds = lastTableScanResult.matchingIds;
  const bmIds = lastBitmapResult.matchingIds;
  const resultSetsEqual = 
    tsIds.length === bmIds.length &&
    tsIds.every((id, idx) => id === bmIds[idx]);

  // 4. Robust statistics
  const tableScanMedian = median(tableScanTimes);
  const bitmapMedian = median(bitmapTimes);
  
  const matchingRows = lastTableScanResult.matchingRows;
  const rowsAvoided = totalRows - matchingRows;
  const rowReductionPct = totalRows > 0 ? (rowsAvoided / totalRows) * 100 : 0;

  // Speedup formula: Table Scan median / Bitmap median
  const speedup = bitmapMedian > 0.0001 ? (tableScanMedian / bitmapMedian) : null;

  // Determine winner with threshold for close calls (within 5% is a tie)
  let winner: 'bitmap' | 'table_scan' | 'tie' = 'tie';
  if (speedup !== null) {
    if (speedup >= 1.05) {
      winner = 'bitmap';
    } else if (speedup <= 0.95) {
      winner = 'table_scan';
    }
  }

  // Calculate Break-Even Queries: indexBuildTime / (tableScanTime - bitmapTime)
  let breakEvenQueries: number | null = null;
  if (indexBuildTimeMs !== undefined && indexBuildTimeMs > 0 && tableScanMedian > bitmapMedian) {
    const savingsPerQuery = tableScanMedian - bitmapMedian;
    breakEvenQueries = Math.ceil(indexBuildTimeMs / savingsPerQuery);
  }

  return {
    totalRows,
    matchingRows,
    tableScanRowsScanned: lastTableScanResult.rowsScanned,
    tableScanPredicateChecks: lastTableScanResult.predicateChecks,
    bitmapVectorsUsed: lastBitmapResult.metrics.bitmapVectorsUsed,
    bitmapOperations: lastBitmapResult.metrics.operationsPerformed.length,
    bitmapCandidateRows: lastBitmapResult.metrics.matchingRows,
    rowsAvoided,
    rowReductionPct,
    tableScanMedianMs: tableScanMedian,
    bitmapMedianMs: bitmapMedian,
    tableScanAverageMs: average(tableScanTimes),
    bitmapAverageMs: average(bitmapTimes),
    tableScanP95Ms: percentile(tableScanTimes, 95),
    bitmapP95Ms: percentile(bitmapTimes, 95),
    speedup,
    resultSetsEqual,
    winner,
    indexBuildTimeMs,
    breakEvenQueries,
    indexMemoryBytes
  };
}
