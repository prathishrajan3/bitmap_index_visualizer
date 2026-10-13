import { 
  LaboratoryReportData, 
  CityReportData, 
  ColumnStatSummary, 
  BitmapVectorSummary, 
  AlgebraOperationSummary, 
  QueryExecutionSummary, 
  QuizAttemptSummary,
  ActivityLogEvent
} from './reportTypes';
import { MIN_RELIABLE_RESOLUTION_MS } from '@/lib/city/cityStatistics';
import { LaboratoryState, QueryRecord, AlgebraRecord, QuizRecord } from '@/store/useLaboratoryStore';
import { CityState } from '@/store/useCityStore';
import { ColumnDefinition, DatasetRow } from '@/lib/bitmap';

/**
 * Formats timestamps into readable human-friendly strings.
 */
export function formatReportDate(dateOrIso?: string | number | Date): string {
  if (!dateOrIso) return 'N/A';
  try {
    const d = new Date(dateOrIso);
    return isNaN(d.getTime()) ? String(dateOrIso) : d.toLocaleString();
  } catch {
    return String(dateOrIso);
  }
}

/**
 * Formats microsecond and millisecond timings with explicit units and sub-resolution guards.
 */
export function formatTimingValue(timeMs?: number, isSubRes?: boolean): string {
  if (timeMs === undefined || timeMs === null || isNaN(timeMs) || !Number.isFinite(timeMs)) {
    return 'N/A';
  }
  if (isSubRes || timeMs < MIN_RELIABLE_RESOLUTION_MS) {
    return '< 0.1 µs (sub-resolution)';
  }
  if (timeMs < 0.001) {
    return `${(timeMs * 1000).toFixed(2)} µs`;
  }
  if (timeMs < 0.05) {
    return `${(timeMs * 1000).toFixed(1)} µs`;
  }
  if (timeMs < 1.0) {
    return `${timeMs.toFixed(3)} ms`;
  }
  return `${timeMs.toFixed(2)} ms`;
}

/**
 * Formats byte counts consistently as KB or MB.
 */
export function formatByteSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) {
    return '0 KB';
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Generates safe filesystem filenames with proper timestamping.
 */
export function generateSafeReportFilename(title: string, format: string): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${cleanTitle}_${timestamp}.${format}`;
}

/**
 * Builds the complete structured report payload for the Bitmap Index Laboratory.
 */
export function buildLaboratoryReportPayload(
  labStore: Partial<LaboratoryState>, 
  learningStore?: { modules?: Record<string, { id: string; title: string; completed?: boolean; score?: number }>; overallMastery?: number }
): LaboratoryReportData {
  const dataset = Array.isArray(labStore.dataset) ? labStore.dataset : [];
  const schema = labStore.schema || { columns: [], domain: 'General' };
  const columns = Array.isArray(schema.columns) ? schema.columns : [];
  const rowCount = dataset.length;

  // 1. Calculate actual dataset statistics
  const columnSummaries: ColumnStatSummary[] = columns.map((col: ColumnDefinition) => {
    const colName = col.name;
    const values = dataset.map((r: DatasetRow) => r[colName]);
    const distinctSet = new Set(values);
    const missing = values.filter((v: unknown) => v === null || v === undefined || v === '').length;
    const sampleVals = Array.from(distinctSet).slice(0, 6).map((v: unknown) => String(v));

    return {
      name: colName,
      type: col.type || 'string',
      cardinality: distinctSet.size,
      distribution: col.distribution || 'Uniform',
      missingCount: missing,
      sampleDistinctValues: sampleVals
    };
  });

  // Calculate duplicate rows (rows where all schema column values match)
  const seenKeys = new Set<string>();
  let duplicateRowCount = 0;
  for (const row of dataset) {
    const key = columns.map((c: ColumnDefinition) => String((row as Record<string, unknown>)[c.name] ?? '')).join('|||');
    if (seenKeys.has(key)) {
      duplicateRowCount++;
    } else {
      seenKeys.add(key);
    }
  }

  // 2. Calculate actual bitmap index statistics
  const bitmapIndex = labStore.bitmapIndex || {};
  const indexedColNames = Object.keys(bitmapIndex);
  const isIndexBuilt = indexedColNames.length > 0 && rowCount > 0;

  const vectorSummaries: BitmapVectorSummary[] = [];
  let totalSetBits = 0;

  if (isIndexBuilt) {
    for (const colName of indexedColNames) {
      const valMap = bitmapIndex[colName] || {};
      for (const [valName, bmp] of Object.entries(valMap) as [string, { bits?: number[]; setBitCount?: number; density?: number }][]) {
        const bitsArr: number[] = Array.isArray(bmp.bits) ? bmp.bits : [];
        const count = typeof bmp.setBitCount === 'number' 
          ? bmp.setBitCount 
          : bitsArr.filter(b => b === 1).length;
        totalSetBits += count;
        const density = typeof bmp.density === 'number'
          ? Math.round(bmp.density * 100)
          : rowCount > 0 ? Math.round((count / rowCount) * 100) : 0;
        const bitPreview = bitsArr.slice(0, 24).join('') + (bitsArr.length > 24 ? `... (${bitsArr.length} bits)` : '');

        vectorSummaries.push({
          columnName: colName,
          valueName: valName,
          bitsPreview: bitPreview,
          count,
          densityPct: density
        });
      }
    }
  }

  const totalVectors = vectorSummaries.length;
  const totalLogicalBits = totalVectors * rowCount;
  const overallDensityPct = totalLogicalBits > 0 ? (totalSetBits / totalLogicalBits) * 100 : 0;
  const estimatedPayloadBytes = totalVectors * Math.ceil(rowCount / 32) * 4;
  const buildDurationMs = labStore.lastIndexBuildStats?.buildDurationMs;

  // 3. Compile Boolean Algebra operations history
  const rawAlgebraHistory: AlgebraRecord[] = Array.isArray(labStore.algebraHistory) ? labStore.algebraHistory : [];
  const algebraOperations: AlgebraOperationSummary[] = rawAlgebraHistory.map(op => ({
    operandA: op.operandA,
    operator: op.operator,
    operandB: op.operandB,
    matchCount: op.matchCount,
    totalRows: op.totalRows || rowCount,
    selectivityPct: op.selectivityPct !== undefined 
      ? op.selectivityPct 
      : (op.totalRows && op.totalRows > 0 ? Math.round((op.matchCount / op.totalRows) * 100) : 0),
    bitsPreview: Array.isArray(op.resultBits) 
      ? op.resultBits.slice(0, 28).join('') + (op.resultBits.length > 28 ? '...' : '')
      : 'N/A',
    timestamp: op.timestamp || new Date().toISOString()
  }));

  // Fallback to latest algebraRecord if history is empty
  if (algebraOperations.length === 0 && labStore.algebraRecord) {
    const ar = labStore.algebraRecord;
    const tRows = rowCount || 1;
    algebraOperations.push({
      operandA: ar.operandA,
      operator: ar.operator,
      operandB: ar.operandB,
      matchCount: ar.matchCount,
      totalRows: tRows,
      selectivityPct: Math.round((ar.matchCount / tRows) * 100),
      bitsPreview: Array.isArray(ar.resultBits) 
        ? ar.resultBits.slice(0, 28).join('') + (ar.resultBits.length > 28 ? '...' : '')
        : 'N/A',
      timestamp: new Date().toISOString()
    });
  }

  // 4. Compile SQL query history
  const rawQueryHistory: QueryRecord[] = Array.isArray(labStore.queryHistory) ? labStore.queryHistory : [];
  const querySummaries: QueryExecutionSummary[] = rawQueryHistory.map(q => ({
    sql: q.sql,
    timestamp: q.timestamp || new Date().toISOString(),
    status: q.status || (q.error ? 'failure' : 'success'),
    executionTimeMs: q.executionTimeMs,
    returnedRows: q.returnedRows ?? (Array.isArray(q.results) ? q.results.length : 0),
    error: q.error,
    sampleRows: Array.isArray(q.results) ? q.results.slice(0, 5) : []
  }));

  if (querySummaries.length === 0 && labStore.queryRecord) {
    const qr = labStore.queryRecord;
    const isErr = qr.executionMsg && qr.executionMsg.startsWith('Error:');
    querySummaries.push({
      sql: qr.sql,
      timestamp: new Date().toISOString(),
      status: isErr ? 'failure' : 'success',
      returnedRows: Array.isArray(qr.results) ? qr.results.length : 0,
      executionTimeMs: qr.executionTimeMs,
      error: isErr ? qr.executionMsg : undefined,
      sampleRows: Array.isArray(qr.results) ? qr.results.slice(0, 5) : []
    });
  }

  const successfulQueries = querySummaries.filter(q => q.status === 'success').length;
  const failedQueries = querySummaries.filter(q => q.status === 'failure').length;

  // 5. Compile Quiz and Learning progress
  const rawQuizHistory: QuizRecord[] = Array.isArray(labStore.quizHistory) ? labStore.quizHistory : [];
  const quizAttempts: QuizAttemptSummary[] = rawQuizHistory
    .filter(q => q.status === 'completed' || q.status === undefined)
    .map(q => ({
      score: q.score,
      total: q.total,
      percentage: q.percentage,
      difficulty: q.difficulty || 'Normal',
      source: q.source || 'pyq',
      completedAt: q.completedAt || new Date().toLocaleTimeString(),
      status: 'completed'
    }));

  if (quizAttempts.length === 0 && labStore.quizRecord && labStore.quizRecord.status !== 'in_progress') {
    const qr = labStore.quizRecord;
    quizAttempts.push({
      score: qr.score,
      total: qr.total,
      percentage: qr.percentage,
      difficulty: qr.difficulty || 'Normal',
      source: qr.source || 'pyq',
      completedAt: qr.completedAt || new Date().toLocaleTimeString(),
      status: 'completed'
    });
  }

  const latestQuiz = quizAttempts.length > 0 ? quizAttempts[quizAttempts.length - 1] : undefined;

  // Learning progress
  const learningModules = learningStore?.modules ? Object.values(learningStore.modules).map((m: { id: string; title: string; completed?: boolean; score?: number }) => ({
    id: m.id,
    title: m.title,
    completed: Boolean(m.completed),
    score: m.score || 0
  })) : [];
  const overallMastery = typeof learningStore?.overallMastery === 'number' ? learningStore.overallMastery : 0;

  // 6. Activity log
  const activityLog: ActivityLogEvent[] = Array.isArray(labStore.activityLog) ? [...labStore.activityLog] : [];
  const activityCounts = labStore.activityCounts || {
    datasetGenerations: labStore.datasetHistory?.length || 1,
    indexBuilds: isIndexBuilt ? 1 : 0,
    algebraOperations: algebraOperations.length,
    sqlAttempts: querySummaries.length,
    sqlSuccesses: successfulQueries,
    sqlFailures: failedQueries,
    quizCompleted: quizAttempts.length
  };

  // 7. Executive summary & configuration
  const executiveSummary = [
    `The current laboratory session operates on a ${rowCount.toLocaleString()}-row '${schema.domain}' dataset with ${columns.length} columns.`,
    isIndexBuilt
      ? `Bitmap index is fully constructed with ${totalVectors} vectors representing distinct categorical values across ${indexedColNames.length} columns.`
      : `Bitmap index has not yet been built for the active dataset.`,
    algebraOperations.length > 0
      ? `Recorded ${algebraOperations.length} Boolean algebra operations evaluating bitwise AND, OR, and XOR expressions.`
      : `No Boolean algebra operations recorded in this session.`,
    querySummaries.length > 0
      ? `Executed ${querySummaries.length} SQL queries against the local dataset (${successfulQueries} succeeded, ${failedQueries} failed).`
      : `No SQL queries executed yet.`,
    latestQuiz
      ? `Completed assessment: ${latestQuiz.score}/${latestQuiz.total} (${latestQuiz.percentage}%) on ${latestQuiz.difficulty} difficulty.`
      : `No completed quiz attempts recorded in this session.`
  ];

  const configuration = [
    { label: 'Dataset Domain', value: schema.domain },
    { label: 'Active Row Count', value: rowCount.toLocaleString() },
    { label: 'Configured Random Seed', value: String(labStore.seed ?? 42) },
    { label: 'Dataset Source', value: labStore.datasetSource || 'synthetic' },
    { label: 'Schema Column Count', value: String(columns.length) },
    { label: 'Indexed Columns', value: indexedColNames.length > 0 ? indexedColNames.join(', ') : 'None' },
    { label: 'Session Started', value: formatReportDate(labStore.sessionStartedAt || new Date().toISOString()) }
  ];

  const processingSteps = [
    '1. Synthesized or imported tabular dataset structured by user-defined schema specifications.',
    '2. Extracted distinct category values per column to establish index dimensionalities.',
    '3. Generated contiguous bit-arrays (bitvectors) for each categorical value mapping row matches to 1s.',
    '4. Enabled SIMD-friendly Boolean algebra evaluation (AND, OR, XOR) over bitvectors.',
    '5. Executed analytical SQL queries against dataset CTEs with precise execution duration tracking.',
    '6. Evaluated conceptual mastery through interactive question banks and learning modules.'
  ];

  const intermediateResults = [
    `Dataset Scale: ${rowCount.toLocaleString()} rows, ${columns.length} columns, ${duplicateRowCount} duplicate row(s)`,
    `Index Status: ${isIndexBuilt ? `Constructed (${totalVectors} vectors, ${formatByteSize(estimatedPayloadBytes)} payload)` : 'Unbuilt'}`,
    `Index Density: ${overallDensityPct.toFixed(1)}% bit saturation (${totalSetBits.toLocaleString()} set bits out of ${totalLogicalBits.toLocaleString()} logical bits)`,
    `Algebra Playground: ${algebraOperations.length} operation(s) executed`,
    `SQL Query Engine: ${successfulQueries} successful execution(s), ${failedQueries} error(s)`
  ];

  const finalOutput = [
    isIndexBuilt
      ? `Bitmap indexing provides O(1) bitwise row membership filtering for all ${indexedColNames.length} indexed categorical columns.`
      : `Bitmap index generation recommended to unlock bitwise query acceleration.`,
    latestQuiz
      ? `Assessment Score: ${latestQuiz.score}/${latestQuiz.total} (${latestQuiz.percentage}% accuracy) - ${latestQuiz.percentage >= 80 ? 'Mastery Level' : latestQuiz.percentage >= 60 ? 'Proficient' : 'Needs Review'}.`
      : `Quiz assessment pending completion.`,
    learningModules.length > 0
      ? `Overall Learning Progress: ${overallMastery}% mastery across ${learningModules.filter(m => m.completed).length}/${learningModules.length} completed modules.`
      : `Learning modules available for study.`
  ];

  const methodologyNotes = [
    '• Bitmap indexes represent distinct category occurrences as boolean bit arrays for hardware-accelerated bitwise operations.',
    '• Set bit density directly corresponds to query selectivity: low-density vectors represent selective category filters.',
    '• Measurements are educational in-browser timings executed on synthetic or imported test data.',
    '• JavaScript V8 memory layout includes object wrappers and headers; payload estimates reflect raw Uint32 word buffer sizes.'
  ];

  return {
    reportType: 'lab',
    title: 'Bitmap Index Laboratory Technical Report',
    generatedAt: new Date().toISOString(),
    sessionStartedAt: labStore.sessionStartedAt || new Date().toISOString(),
    executiveSummary,
    configuration,
    datasetOverview: {
      rowCount,
      columnCount: columns.length,
      source: labStore.datasetSource || 'synthetic',
      seed: labStore.seed,
      domain: schema.domain,
      duplicateRows: duplicateRowCount,
      columns: columnSummaries,
      sampleRows: dataset.slice(0, 30)
    },
    datasetHistory: Array.isArray(labStore.datasetHistory) ? labStore.datasetHistory : [],
    bitmapIndexStats: {
      built: isIndexBuilt,
      indexedColumns: indexedColNames,
      vectorCount: totalVectors,
      distinctValuesCount: totalVectors,
      bitLength: rowCount,
      totalLogicalBits,
      setBitsCount: totalSetBits,
      overallDensityPct,
      buildDurationMs,
      estimatedPayloadBytes,
      vectors: vectorSummaries
    },
    algebraStats: {
      totalOperations: algebraOperations.length,
      operations: algebraOperations
    },
    queryStats: {
      totalQueries: querySummaries.length,
      successfulQueries,
      failedQueries,
      queries: querySummaries
    },
    quizStats: {
      completed: quizAttempts.length > 0,
      attemptsCount: quizAttempts.length,
      latestAttempt: latestQuiz,
      allAttempts: quizAttempts
    },
    learningStats: {
      overallMastery,
      modules: learningModules
    },
    activitySummary: {
      totalEvents: activityLog.length,
      counts: activityCounts as unknown as Record<string, number>,
      timeline: activityLog.slice(0, 100)
    },
    processingSteps,
    intermediateResults,
    finalOutput,
    methodologyNotes
  };
}

/**
 * Builds the complete structured report payload for Nova Smart City Digital Twin.
 */
export function buildCityReportPayload(cityStore: Partial<CityState>): CityReportData {
  const dataset = Array.isArray(cityStore.dataset) ? cityStore.dataset : [];
  const totalEntities = dataset.length;

  // 1. Calculate actual City dataset statistics from dataset array
  const districtCounts: Record<string, number> = {};
  const entityTypeCounts: Record<string, number> = {};
  const trafficDistribution: Record<string, number> = {};
  const riskDistribution: Record<string, number> = {};
  const airQualityDistribution: Record<string, number> = {};

  for (const entity of dataset) {
    if (entity.district) districtCounts[entity.district] = (districtCounts[entity.district] || 0) + 1;
    if (entity.entityType) entityTypeCounts[entity.entityType] = (entityTypeCounts[entity.entityType] || 0) + 1;
    if (entity.trafficLevel) trafficDistribution[entity.trafficLevel] = (trafficDistribution[entity.trafficLevel] || 0) + 1;
    if (entity.riskLevel) riskDistribution[entity.riskLevel] = (riskDistribution[entity.riskLevel] || 0) + 1;
    if (entity.airQuality) airQualityDistribution[entity.airQuality] = (airQualityDistribution[entity.airQuality] || 0) + 1;
  }

  // 2. Active Query & Match Status
  const activeQuery = cityStore.activeQuery;
  const hasQuery = Boolean(activeQuery);
  const matchingCount = cityStore.queryResultEntityIds ? cityStore.queryResultEntityIds.size : 0;
  const matchingPct = totalEntities > 0 ? (matchingCount / totalEntities) * 100 : 0;
  const scanScope = cityStore.scanScope === 'city' ? 'City-Wide Scope' : (cityStore.selectedDistrict || 'District');

  const issueLabels: string[] = [];
  if (cityStore.issueFilters) {
    if (cityStore.issueFilters.traffic) issueLabels.push('Severe Traffic');
    if (cityStore.issueFilters.accident) issueLabels.push('Accidents');
    if (cityStore.issueFilters.pollution) issueLabels.push('Hazardous Air');
    if (cityStore.issueFilters.power) issueLabels.push('Power Failures');
    if (cityStore.issueFilters.hospital) issueLabels.push('Critical Hospital Load');
    if (cityStore.issueFilters.risk) issueLabels.push('Critical Risk');
  }

  const queryDescription = hasQuery 
    ? (issueLabels.length > 0 ? `${issueLabels.join(' OR ')} in ${scanScope}` : `Query in ${scanScope}`)
    : 'No active query executed';

  // 3. Current Query Benchmark (from lastBenchmarkResult)
  const lastBench = cityStore.lastBenchmarkResult;
  const hasBenchmark = Boolean(lastBench && typeof lastBench === 'object' && lastBench.totalRows > 0);

  // 4. Scaling Experiment Run
  const scalingRun = cityStore.scalingRunRecord;
  const hasScaling = Boolean(scalingRun && scalingRun.datasetSizes && scalingRun.datasetSizes.length > 0 && Object.keys(scalingRun.resultsBySize || {}).length > 0);

  // Evidence-based scaling interpretation
  const keyFindings: string[] = [];
  let breakEvenConclusion = 'N/A';

  if (hasScaling && scalingRun) {
    const sizes = scalingRun.datasetSizes.filter((s: number) => scalingRun.resultsBySize[s]);
    const winningSizes = sizes.filter((s: number) => {
      const pt = scalingRun.resultsBySize[s];
      return pt?.stats?.winner === 'bitmap';
    });

    if (winningSizes.length > 0) {
      keyFindings.push(`Packed Bitmap outperformed Table Scan across ${winningSizes.length} of ${sizes.length} evaluated dataset sizes (${winningSizes.map((s: number) => s.toLocaleString()).join(', ')} records).`);
    } else {
      keyFindings.push(`Table Scan outperformed or tied Packed Bitmap across the evaluated dataset sizes under current query selectivity.`);
    }

    // Check row reduction
    const sampleSize = sizes[sizes.length - 1];
    if (sampleSize && scalingRun.resultsBySize[sampleSize]) {
      const stats = scalingRun.resultsBySize[sampleSize].stats;
      keyFindings.push(`Row reduction efficiency: Bitmap bitvectors filtered out ${stats.rowsAvoided.toLocaleString()} non-matching records (${stats.rowReductionPct.toFixed(1)}% reduction), avoiding predicate evaluation on those rows.`);
      if (stats.breakEvenQueries) {
        breakEvenConclusion = `Index construction overhead breaks even after approximately ${stats.breakEvenQueries} query executions on a ${sampleSize.toLocaleString()}-entity dataset.`;
      } else {
        breakEvenConclusion = stats.breakEvenStatus || 'Break-even queries cannot be calculated for this configuration.';
      }
    }

    // Check correctness
    const allValid = sizes.every((s: number) => scalingRun.resultsBySize[s]?.stats?.resultSetsEqual);
    if (allValid) {
      keyFindings.push('Result equivalence verified: 100% identical matching record ID sets across all evaluated scaling sizes.');
    } else {
      keyFindings.push('WARNING: One or more scaling sizes reported result set divergence.');
    }
  }

  // 5. Simulation Configuration
  const simulationConfig = [
    { label: 'Active Scenario', value: cityStore.activeScenario || 'None' },
    { label: 'Time of Day', value: cityStore.timeOfDay || 'Morning' },
    { label: 'Weather Conditions', value: cityStore.weather || 'Clear' },
    { label: 'Simulation Status', value: cityStore.simulationRunning ? `Running (${cityStore.simulationSpeed}x)` : 'Paused' },
    { label: 'Active District Focus', value: cityStore.selectedDistrict || 'Central Business District' },
    { label: 'Query Target Scope', value: scanScope },
    { label: 'Active Issue Types', value: issueLabels.length > 0 ? issueLabels.join(', ') : 'None selected' },
    { label: 'Heatmap Overlay', value: cityStore.heatmapMode || 'None' },
    { label: 'Educational Mode', value: cityStore.educationalMode ? 'Enabled' : 'Disabled' },
    { label: 'Demo Mode', value: cityStore.demoMode ? 'Enabled' : 'Disabled' }
  ];

  // 6. Executive summary
  const executiveSummary = [
    `Nova Smart City digital twin monitors ${totalEntities.toLocaleString()} urban infrastructure entities across ${Object.keys(districtCounts).length} geographic districts.`,
    hasQuery
      ? `Active Query: ${matchingCount.toLocaleString()} entities matched (${matchingPct.toFixed(1)}% of city) for filter '${queryDescription}'.`
      : `No query currently active on the city grid.`,
    hasBenchmark && lastBench
      ? `Live Query Benchmark: Table Scan took ${formatTimingValue(lastBench.tableScanMedianMs)} vs Packed Bitmap ${formatTimingValue(lastBench.bitmapMedianMs)} (${lastBench.speedup ? `${lastBench.speedup.toFixed(1)}x speedup` : lastBench.winner}).`
      : `Live query benchmark has not been executed on the current dataset.`,
    hasScaling && scalingRun
      ? `Scaling Experiment: Evaluated across ${scalingRun.datasetSizes.length} dataset sizes (up to ${scalingRun.datasetSizes[scalingRun.datasetSizes.length - 1].toLocaleString()} entities).`
      : `Scaling experiment has not been executed. Run the Scaling Benchmark in Performance Lab for multi-scale analysis.`
  ];

  const activityLog: ActivityLogEvent[] = Array.isArray(cityStore.cityActivityLog) ? [...cityStore.cityActivityLog] : [];
  const activityCounts = cityStore.cityActivityCounts || {
    queryExecutions: hasQuery ? 1 : 0,
    issueScans: 0,
    scalingExperiments: hasScaling ? 1 : 0,
    benchmarkRuns: hasBenchmark ? 1 : 0
  };

  const processingSteps = [
    '1. Generated isolated synthetic digital-twin entities with multi-attribute categorical states.',
    '2. Constructed packed Uint32Array bitmap index vectors for every categorical dimension.',
    '3. Parsed Performance Lab filter controls into a standardized Query AST with short-circuiting logic.',
    '4. Evaluated AST using conventional row-by-row Table Scan and Packed Bitmap bitwise operations.',
    '5. Verified 100% record ID equivalence between both query evaluation paths.',
    '6. Collected independent benchmark timing samples using calibrated 20–25ms batches to eliminate timer quantization noise.'
  ];

  const intermediateResults = [
    `Digital Twin Entities: ${totalEntities.toLocaleString()} records across ${Object.keys(districtCounts).length} districts`,
    hasBenchmark && lastBench 
      ? `Single-Query Latency: TS ${formatTimingValue(lastBench.tableScanMedianMs)} vs BM ${formatTimingValue(lastBench.bitmapMedianMs)} (Winner: ${lastBench.winner})`
      : `Single-Query Benchmark: Not executed yet`,
    hasBenchmark && lastBench 
      ? `Rows Avoided: ${lastBench.rowsAvoided.toLocaleString()} (${lastBench.rowReductionPct.toFixed(1)}% row reduction)`
      : `Row Reduction: Awaiting benchmark execution`,
    hasScaling && scalingRun 
      ? `Scaling Experiment: Completed ${Object.keys(scalingRun.resultsBySize || {}).length} dataset size benchmarks`
      : `Scaling Experiment: Not executed yet`
  ];

  const finalOutput = [
    hasBenchmark && lastBench && lastBench.speedup
      ? `Packed Bitmap Index delivers ${lastBench.speedup.toFixed(1)}x speedup over Table Scan on the live ${totalEntities.toLocaleString()}-entity city dataset.`
      : hasBenchmark && lastBench
      ? `Table Scan and Bitmap Index evaluated with winner: ${lastBench.winner}.`
      : `Execute a scan in the Performance Lab to evaluate live query acceleration.`,
    hasScaling
      ? `Scaling Analysis: ${breakEvenConclusion}`
      : `Execute the Scaling Experiment in Performance Lab to identify the one-time build break-even threshold.`
  ];

  const methodologyNotes = [
    '• Benchmarks are performed directly within the browser runtime using performance.now() high-resolution timers.',
    '• Table Scan iterates through every row evaluating predicates with short-circuiting and returns matching record IDs.',
    '• Packed Bitmap operates on 32-bit Uint32 words, skipping 32 non-matching rows simultaneously when word values are 0.',
    '• Batch sizes are calibrated independently to 20–25ms intervals to prevent sub-microsecond quantization noise.',
    '• All timing measurements represent isolated query execution; dataset generation and index construction are strictly excluded from execution latency.'
  ];

  return {
    reportType: 'city',
    title: 'Nova Smart City Analytics & Benchmark Report',
    generatedAt: new Date().toISOString(),
    executiveSummary,
    simulationConfig,
    datasetStats: {
      totalEntities,
      districtCounts,
      entityTypeCounts,
      trafficDistribution,
      riskDistribution,
      airQualityDistribution
    },
    activeQuery: {
      executed: hasQuery,
      description: queryDescription,
      scope: scanScope,
      district: cityStore.selectedDistrict ?? null,
      matchingCount,
      matchingPct
    },
    currentBenchmark: (hasBenchmark && lastBench) ? {
      hasBenchmark: true,
      stats: lastBench
    } : { hasBenchmark: false },
    scalingExperiment: (hasScaling && scalingRun) ? {
      hasScaling: true,
      runRecord: scalingRun,
      keyFindings,
      breakEvenConclusion
    } : {
      hasScaling: false,
      keyFindings: ['No scaling experiment results recorded. Run the Scaling Experiment in Nova City to benchmark retrieval across dataset sizes.'],
      breakEvenConclusion: 'No break-even data available.'
    },
    activitySummary: {
      totalEvents: activityLog.length,
      counts: activityCounts as unknown as Record<string, number>,
      timeline: activityLog.slice(0, 100)
    },
    processingSteps,
    intermediateResults,
    finalOutput,
    methodologyNotes
  };
}
