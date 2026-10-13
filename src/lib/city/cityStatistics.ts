import { CityEntity, CityBitmapIndex, CityQueryNode } from './cityTypes';
import { executeCityQuery, executeCityQueryFast, CityExecutionResult } from './cityQueries';

export const MIN_RELIABLE_RESOLUTION_MS = 0.0001; // 0.1 microseconds (100 nanoseconds)

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
  winner: 'bitmap' | 'table_scan' | 'tie' | 'inconclusive';
  indexBuildTimeMs?: number;
  breakEvenQueries?: number | null;
  indexMemoryBytes?: number;
  tableScanBatchSize?: number;
  bitmapBatchSize?: number;
  tableScanSubResolution?: boolean;
  bitmapSubResolution?: boolean;
}

export interface AdaptiveBatchConfig {
  targetDurationMs?: number;      // Target total duration for a batch (default: 25ms)
  minTargetDurationMs?: number;   // Minimum acceptable batch duration (default: 20ms)
  maxBatchSize?: number;          // Maximum executions per batch safety cap (default: 10000)
  maxCalibrationMs?: number;      // Safety timeout for calibration phase (default: 100ms)
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
 * Executes a conventional Table Scan with predicate check count and single-run metrics.
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

/**
 * Fast condition evaluator for Table Scan benchmark path without check counter mutation.
 */
function evaluateConditionFast(row: CityEntity, node: CityQueryNode): boolean {
  if (node.type === 'predicate') {
    const rowVal = String(row[node.column]);
    if (node.operator === '=') return rowVal === node.value;
    if (node.operator === '!=') return rowVal !== node.value;
    return false;
  }
  
  if (node.type === 'not') {
    return !evaluateConditionFast(row, node.operand);
  }
  
  if (node.type === 'logical') {
    const left = evaluateConditionFast(row, node.left);
    
    // Realistic short-circuiting
    if (node.operator === 'AND' && !left) return false;
    if (node.operator === 'OR' && left) return true;
    
    const right = evaluateConditionFast(row, node.right);
    if (node.operator === 'AND') return left && right;
    if (node.operator === 'OR') return left || right;
    if (node.operator === 'XOR') return (left || right) && !(left && right);
  }
  
  return false;
}

/**
 * Pure Table Scan benchmark execution path without internal performance.now() timer overhead.
 * Evaluates identical query predicates with early exits and materializes matching record IDs.
 */
export function executeTableScanFast(ast: CityQueryNode, dataset: CityEntity[]): string[] {
  const matchingIds: string[] = [];
  const len = dataset.length;
  for (let i = 0; i < len; i++) {
    if (evaluateConditionFast(dataset[i], ast)) {
      matchingIds.push(dataset[i].id);
    }
  }
  return matchingIds;
}

// Math helpers
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Dynamically determines the batch size needed to reach the target interval (20–50 ms).
 * Prevents zero-microsecond timer quantization artifacts on fast operations while
 * preventing page freezing or excessive memory allocation on large datasets.
 */
export function calibrateBatchSize(
  fn: () => number,
  config: AdaptiveBatchConfig = {}
): number {
  const targetDurationMs = config.targetDurationMs ?? 25;
  const minTargetDurationMs = config.minTargetDurationMs ?? 20;
  const maxBatchSize = config.maxBatchSize ?? 10000;
  const maxCalibrationMs = config.maxCalibrationMs ?? 100;

  // Warm-up unmeasured
  for (let w = 0; w < 3; w++) {
    fn();
  }

  let trialBatch = 1;
  const calStart = performance.now();

  while (trialBatch < maxBatchSize) {
    const t0 = performance.now();
    let sink = 0;
    for (let i = 0; i < trialBatch; i++) {
      sink += fn();
    }
    const elapsed = performance.now() - t0;

    // Reached target interval
    if (elapsed >= minTargetDurationMs) {
      return trialBatch;
    }

    // Safety timeout check
    if (performance.now() - calStart >= maxCalibrationMs) {
      if (elapsed > 0.05) {
        const est = Math.ceil((targetDurationMs / elapsed) * trialBatch);
        return Math.min(maxBatchSize, Math.max(1, est));
      }
      return Math.min(maxBatchSize, trialBatch * 2);
    }

    // Direct extrapolation if elapsed has measurable signal (>= 0.5 ms)
    if (elapsed >= 0.5) {
      const estimated = Math.ceil((targetDurationMs / elapsed) * trialBatch);
      return Math.min(maxBatchSize, Math.max(1, estimated));
    }

    // Scale up geometrically for sub-millisecond durations
    trialBatch = Math.min(maxBatchSize, trialBatch * 10);
  }

  return maxBatchSize;
}

/**
 * Runs repeated benchmark executions comparing Table Scan vs. Bitmap Index.
 * Uses adaptive-duration batching (20–50 ms intervals) to eliminate zero-microsecond artifacts,
 * removes internal timer overhead from hot query loops, and consumes results to prevent JIT dead-code elimination.
 */
export function runRepeatedCityBenchmark(
  ast: CityQueryNode, 
  dataset: CityEntity[], 
  bitmapIndex: CityBitmapIndex,
  warmupIterations = 5,
  sampleCount = 7,
  indexBuildTimeMs?: number,
  indexMemoryBytes?: number,
  batchConfig?: AdaptiveBatchConfig
): CityBenchmarkStatistics {
  
  const datasetIds = dataset.map(e => e.id);
  const totalRows = dataset.length;

  // 1. Initial full run for metrics and strict result-set validation
  const fullTsResult = executeTableScan(ast, dataset);
  const fullBmResult = executeCityQuery(ast, bitmapIndex, totalRows, datasetIds);

  const tsIds = fullTsResult.matchingIds;
  const bmIds = fullBmResult.matchingIds;
  const resultSetsEqual = 
    tsIds.length === bmIds.length &&
    tsIds.every((id, idx) => id === bmIds[idx]);

  // 2. Warm-up executions on fast benchmark path
  for (let i = 0; i < warmupIterations; i++) {
    executeTableScanFast(ast, dataset);
    executeCityQueryFast(ast, bitmapIndex, totalRows, datasetIds);
  }

  // 3. Calibrate adaptive batch sizes independently for each method
  const tsBatchSize = calibrateBatchSize(
    () => executeTableScanFast(ast, dataset).length,
    batchConfig
  );
  const bmBatchSize = calibrateBatchSize(
    () => executeCityQueryFast(ast, bitmapIndex, totalRows, datasetIds).length,
    batchConfig
  );

  const tableScanTimes: number[] = [];
  const bitmapTimes: number[] = [];

  // 4. Collect independent samples with counterbalanced alternating order
  for (let s = 0; s < sampleCount; s++) {
    if (s % 2 === 0) {
      // Table Scan first
      const tsStart = performance.now();
      let tsSink = 0;
      for (let b = 0; b < tsBatchSize; b++) {
        tsSink += executeTableScanFast(ast, dataset).length;
      }
      const tsElapsed = performance.now() - tsStart;
      tableScanTimes.push(tsElapsed / tsBatchSize);

      // Bitmap second
      const bmStart = performance.now();
      let bmSink = 0;
      for (let b = 0; b < bmBatchSize; b++) {
        bmSink += executeCityQueryFast(ast, bitmapIndex, totalRows, datasetIds).length;
      }
      const bmElapsed = performance.now() - bmStart;
      bitmapTimes.push(bmElapsed / bmBatchSize);
    } else {
      // Bitmap first
      const bmStart = performance.now();
      let bmSink = 0;
      for (let b = 0; b < bmBatchSize; b++) {
        bmSink += executeCityQueryFast(ast, bitmapIndex, totalRows, datasetIds).length;
      }
      const bmElapsed = performance.now() - bmStart;
      bitmapTimes.push(bmElapsed / bmBatchSize);

      // Table Scan second
      const tsStart = performance.now();
      let tsSink = 0;
      for (let b = 0; b < tsBatchSize; b++) {
        tsSink += executeTableScanFast(ast, dataset).length;
      }
      const tsElapsed = performance.now() - tsStart;
      tableScanTimes.push(tsElapsed / tsBatchSize);
    }
  }

  // 5. Robust statistics
  const tableScanMedian = median(tableScanTimes);
  const bitmapMedian = median(bitmapTimes);

  const tableScanSubResolution = tableScanMedian < MIN_RELIABLE_RESOLUTION_MS;
  const bitmapSubResolution = bitmapMedian < MIN_RELIABLE_RESOLUTION_MS;

  const matchingRows = fullTsResult.matchingRows;
  const rowsAvoided = totalRows - matchingRows;
  const rowReductionPct = totalRows > 0 ? (rowsAvoided / totalRows) * 100 : 0;

  // 6. Safe Speedup and Winner Calculation
  let speedup: number | null = null;
  let winner: 'bitmap' | 'table_scan' | 'tie' | 'inconclusive' = 'inconclusive';

  const tsValid = !tableScanSubResolution && tableScanMedian >= MIN_RELIABLE_RESOLUTION_MS;
  const bmValid = !bitmapSubResolution && bitmapMedian >= MIN_RELIABLE_RESOLUTION_MS;

  if (tsValid && bmValid) {
    speedup = tableScanMedian / bitmapMedian;
    if (speedup >= 1.05) {
      winner = 'bitmap';
    } else if (speedup <= 0.95) {
      winner = 'table_scan';
    } else {
      winner = 'tie';
    }
  } else if (!tsValid && !bmValid) {
    // Both sub-resolution
    speedup = null;
    winner = 'inconclusive';
  } else if (tsValid && !bmValid) {
    // Bitmap is faster than measurable sub-resolution limit
    speedup = tableScanMedian / MIN_RELIABLE_RESOLUTION_MS;
    winner = 'bitmap';
  } else {
    // Table Scan is sub-resolution
    speedup = MIN_RELIABLE_RESOLUTION_MS / bitmapMedian;
    winner = 'table_scan';
  }

  // 7. Calculate Break-Even Queries: indexBuildTime / (tableScanTime - bitmapTime)
  let breakEvenQueries: number | null = null;
  if (indexBuildTimeMs !== undefined && indexBuildTimeMs > 0 && tableScanMedian > bitmapMedian) {
    const savingsPerQuery = tableScanMedian - bitmapMedian;
    if (savingsPerQuery > 0) {
      breakEvenQueries = Math.ceil(indexBuildTimeMs / savingsPerQuery);
    }
  }

  return {
    totalRows,
    matchingRows,
    tableScanRowsScanned: fullTsResult.rowsScanned,
    tableScanPredicateChecks: fullTsResult.predicateChecks,
    bitmapVectorsUsed: fullBmResult.metrics.bitmapVectorsUsed,
    bitmapOperations: fullBmResult.metrics.operationsPerformed.length,
    bitmapCandidateRows: fullBmResult.metrics.matchingRows,
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
    indexMemoryBytes,
    tableScanBatchSize: tsBatchSize,
    bitmapBatchSize: bmBatchSize,
    tableScanSubResolution,
    bitmapSubResolution
  };
}
