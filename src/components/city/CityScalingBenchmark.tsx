"use client";

import React, { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { generateCityData } from '@/lib/city/cityGenerator';
import { 
  runRepeatedCityBenchmark, 
  measureIndexBuildTime,
  CityBenchmarkStatistics, 
  MIN_RELIABLE_RESOLUTION_MS 
} from '@/lib/city/cityStatistics';
import { estimatePackedIndexBytes } from '@/lib/city/packedBitmap';
import { CityQueryNode } from '@/lib/city/cityTypes';
import { 
  tryBuildCityQueryAST, 
  CityQueryBuildResult, 
  CITY_ISSUE_DEFINITIONS 
} from '@/lib/city/cityQueries';
import { 
  Play, 
  Activity, 
  Database, 
  CheckCircle2, 
  Zap, 
  Clock, 
  HardDrive, 
  BarChart3, 
  Info, 
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Building2,
  Globe2,
  Tag
} from 'lucide-react';

const STANDARD_SIZES = [2000, 5000, 10000, 20000, 30000];
const EXTENDED_SIZES = [2000, 5000, 10000, 20000, 30000, 50000, 100000, 250000];

/**
 * Formats sub-millisecond execution times with appropriate precision
 * without rounding non-zero measurements to zero.
 */
function formatTiming(timeMs: number, isSubRes?: boolean): string {
  if (isSubRes || timeMs < MIN_RELIABLE_RESOLUTION_MS) {
    return '< 0.1 µs';
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
 * Formats memory payload in KB or MB with consistent units.
 */
function formatMemoryPayload(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

import { CityScalingRunRecord } from '@/utils/reportTypes';

interface BenchmarkSnapshot {
  summary: string;
  ast: CityQueryNode;
  selectionKey: string;
  scope: string;
  district: string | null;
  issueLabels: string[];
}

export function CityScalingBenchmark() {
  const { 
    selectedDistrict, 
    issueFilters, 
    scanScope, 
    isScalingBenchmarkRunning, 
    setIsScalingBenchmarkRunning,
    setScalingRunRecord,
    logCityActivity 
  } = useCityStore();

  const [useExtendedSuite, setUseExtendedSuite] = useState<boolean>(true);
  const [results, setResults] = useState<Record<number, CityBenchmarkStatistics>>({});
  const [currentSize, setCurrentSize] = useState<number | null>(null);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);
  const [benchmarkSnapshot, setBenchmarkSnapshot] = useState<BenchmarkSnapshot | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  const activeSizes = useExtendedSuite ? EXTENDED_SIZES : STANDARD_SIZES;

  // Build the live query AST from the Performance Lab selection
  const liveQueryConfig: CityQueryBuildResult = tryBuildCityQueryAST({
    district: selectedDistrict,
    issues: issueFilters,
    isCityWide: scanScope === 'city'
  });

  // Unique signature of current UI selection to track staleness
  const currentSelectionKey = `${scanScope}:${selectedDistrict}:${Object.entries(issueFilters)
    .sort()
    .map(([k, v]) => `${k}:${v}`)
    .join(',')}`;

  const isStale = benchmarkSnapshot !== null && 
    benchmarkSnapshot.selectionKey !== currentSelectionKey && 
    Object.keys(results).length > 0;

  const runScalingExperiment = async () => {
    if (!liveQueryConfig.isValid || !liveQueryConfig.ast) {
      setBenchmarkError(liveQueryConfig.error || "Cannot run benchmark with invalid query selection.");
      return;
    }

    setBenchmarkError(null);
    setIsScalingBenchmarkRunning(true);
    setResults({});

    // Snapshot the exact AST and selection configuration at run start
    const snapshot: BenchmarkSnapshot = {
      summary: liveQueryConfig.summary,
      ast: liveQueryConfig.ast,
      selectionKey: currentSelectionKey,
      scope: scanScope === 'city' ? 'City-Wide' : (selectedDistrict || 'District'),
      district: selectedDistrict,
      issueLabels: [...liveQueryConfig.selectedIssueLabels]
    };
    setBenchmarkSnapshot(snapshot);

    const runId = `scaling-${Date.now()}`;
    const newScalingRecord: CityScalingRunRecord = {
      runId,
      timestamp: new Date().toISOString(),
      querySummary: liveQueryConfig.summary,
      scope: scanScope === 'city' ? 'city' : 'district',
      district: selectedDistrict,
      issueLabels: [...liveQueryConfig.selectedIssueLabels],
      ast: snapshot.ast,
      datasetSizes: activeSizes,
      resultsBySize: {},
      status: 'in_progress'
    };
    setScalingRunRecord(newScalingRecord);
    logCityActivity('scaling_start', `Started scaling experiment on ${activeSizes.length} sizes (${snapshot.summary})`);

    try {
      for (const size of activeSizes) {
        setCurrentSize(size);
        
        // Yield to browser UI thread to keep animations and progress indicators responsive
        await new Promise(r => setTimeout(r, 40));

        // Generate isolated deterministic benchmark dataset
        const dataStart = performance.now();
        const testData = generateCityData({ seed: 999, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
        const genTimeMs = performance.now() - dataStart;

        // Measure one-time index build time with independent repetitions, unmeasured warm-up, and median statistics
        const { medianBuildTimeMs: buildTimeMs, finalIndex: testIndex } = measureIndexBuildTime(testData);

        // Calculate packed index memory payload
        const memoryBytes = estimatePackedIndexBytes(testIndex, size);

        // Run repeated benchmark using the exact snapshotted AST for BOTH Table Scan and Bitmap
        const stats = runRepeatedCityBenchmark(
          snapshot.ast, 
          testData, 
          testIndex, 
          5, 
          7, 
          buildTimeMs, 
          memoryBytes,
          { targetDurationMs: 25, minTargetDurationMs: 20, maxBatchSize: 10000 }
        );
        
        setResults(prev => ({ ...prev, [size]: stats }));

        newScalingRecord.resultsBySize[size] = {
          genTimeMs,
          buildTimeMs,
          memoryBytes,
          stats
        };
        setScalingRunRecord({ ...newScalingRecord });
      }

      newScalingRecord.status = 'completed';
      setScalingRunRecord({ ...newScalingRecord });
      logCityActivity('scaling_complete', `Completed scaling experiment up to ${activeSizes[activeSizes.length - 1].toLocaleString()} records`);
    } catch (e: any) {
      console.error("Scaling test error:", e);
      setBenchmarkError(e?.message || "An unexpected error occurred during benchmark execution.");
      newScalingRecord.status = 'failed';
      newScalingRecord.error = e?.message;
      setScalingRunRecord({ ...newScalingRecord });
      logCityActivity('scaling_error', `Scaling benchmark failed: ${e?.message}`, 'failure');
    } finally {
      setIsScalingBenchmarkRunning(false);
      setCurrentSize(null);
    }
  };

  const handleClearResults = () => {
    setResults({});
    setBenchmarkSnapshot(null);
    setBenchmarkError(null);
    setScalingRunRecord(null);
    logCityActivity('scaling_clear', 'Cleared scaling benchmark results');
  };

  // Find maximum execution time for SVG bar chart scaling
  const chartMaxTime = Math.max(
    ...Object.values(results).map(r => Math.max(r.tableScanMedianMs, r.bitmapMedianMs)),
    0.05
  );

  const displayedSummary = benchmarkSnapshot ? benchmarkSnapshot.summary : liveQueryConfig.summary;
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="p-4 flex flex-col gap-4 bg-neutral-900 border-t border-neutral-800">
      
      {/* Header and Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Scaling Experiment
            </h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Benchmarks your active Performance Lab selection across dataset sizes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasResults && (
              <button
                onClick={handleClearResults}
                disabled={isScalingBenchmarkRunning}
                className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700 disabled:opacity-50"
                title="Clear current benchmark results"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button 
              onClick={runScalingExperiment}
              disabled={isScalingBenchmarkRunning || !liveQueryConfig.isValid}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isScalingBenchmarkRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-white" />
                  <span>Run Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Query Selection Display */}
        <div className="bg-black/50 p-2.5 rounded-md border border-neutral-800 flex flex-col gap-2 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-neutral-400">Target Query:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                {scanScope === 'city' ? <Globe2 className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                {scanScope === 'city' ? 'City-Wide Scope' : (selectedDistrict || 'District')}
              </span>
            </div>
            
            <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 shrink-0 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={useExtendedSuite}
                onChange={(e) => {
                  if (!isScalingBenchmarkRunning) {
                    setUseExtendedSuite(e.target.checked);
                    setResults({});
                  }
                }}
                disabled={isScalingBenchmarkRunning}
                className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 w-3 h-3"
              />
              <span>250K Scale</span>
            </label>
          </div>

          {/* Active Issue Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-neutral-500 font-mono">Issues:</span>
            {liveQueryConfig.selectedIssueLabels.length > 0 ? (
              liveQueryConfig.selectedIssueLabels.map(label => (
                <span key={label} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {label}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-amber-400 italic">None selected</span>
            )}
          </div>

          {/* Logic Summary */}
          <div className="text-[10px] font-mono text-neutral-400 bg-neutral-950/60 p-1.5 rounded border border-neutral-800/60 truncate" title={displayedSummary}>
            <span className="text-neutral-500 font-sans">Logic: </span>
            <span className="text-neutral-300">{displayedSummary}</span>
          </div>

          {/* Stale Results Warning Banner */}
          {isStale && (
            <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[10px] text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Selection modified in Issue Scanner. Results below reflect: <strong>{benchmarkSnapshot?.summary}</strong>.
                </span>
              </div>
              <button 
                onClick={runScalingExperiment}
                className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold shrink-0 transition-colors"
              >
                Re-Run
              </button>
            </div>
          )}

          {/* Query Validation Error Banner */}
          {!liveQueryConfig.isValid && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-[10px] text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{liveQueryConfig.error}</span>
            </div>
          )}

          {/* Benchmark Execution Error Banner */}
          {benchmarkError && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-800/60 text-[10px] text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Benchmark error: {benchmarkError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      <div className="w-full overflow-x-auto border border-neutral-800 rounded-md bg-[#0a0a0c]">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-800/60 text-[10px] uppercase text-neutral-400 font-semibold">
            <tr>
              <th className="px-3 py-2">Rows</th>
              <th className="px-3 py-2 text-amber-400">Table Scan</th>
              <th className="px-3 py-2 text-cyan-400">Packed Bitmap</th>
              <th className="px-3 py-2">Matches</th>
              <th className="px-3 py-2 text-center">Winner</th>
              <th className="px-3 py-2 text-right">Speedup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50 font-mono text-[11px]">
            {activeSizes.map(size => {
              const res = results[size];
              const isCurrent = currentSize === size;
              
              if (isCurrent) {
                return (
                  <tr key={size} className="bg-emerald-500/10">
                    <td className="px-3 py-2.5 font-bold text-white">{size.toLocaleString()}</td>
                    <td colSpan={5} className="px-3 py-2.5 text-emerald-400 text-center animate-pulse">
                      Benchmarking {size.toLocaleString()} records...
                    </td>
                  </tr>
                );
              }

              if (!res) {
                return (
                  <tr key={size} className="hover:bg-neutral-800/20">
                    <td className="px-3 py-2 text-neutral-500">{size.toLocaleString()}</td>
                    <td className="px-3 py-2 text-neutral-600">-</td>
                    <td className="px-3 py-2 text-neutral-600">-</td>
                    <td className="px-3 py-2 text-neutral-600">-</td>
                    <td className="px-3 py-2 text-neutral-600 text-center">-</td>
                    <td className="px-3 py-2 text-neutral-600 text-right">-</td>
                  </tr>
                );
              }

              return (
                <tr key={size} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-3 py-2 text-neutral-200 font-medium">{size.toLocaleString()}</td>
                  <td className="px-3 py-2 text-amber-400">
                    {formatTiming(res.tableScanMedianMs, res.tableScanSubResolution)}
                  </td>
                  <td className="px-3 py-2 text-cyan-400">
                    {formatTiming(res.bitmapMedianMs, res.bitmapSubResolution)}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">
                    <div className="flex items-center gap-1">
                      <span>{res.matchingRows.toLocaleString()}</span>
                      {res.resultSetsEqual ? (
                        <span title="Result sets 100% identical">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </span>
                      ) : (
                        <span title="WARNING: Result set mismatch between Table Scan and Bitmap!" className="text-rose-500 font-bold">
                          <AlertTriangle className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {!res.resultSetsEqual ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        MISMATCH
                      </span>
                    ) : res.winner === 'bitmap' ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        BITMAP
                      </span>
                    ) : res.winner === 'table_scan' ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        SCAN
                      </span>
                    ) : res.winner === 'tie' ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-800 text-neutral-400">
                        TIE
                      </span>
                    ) : (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-800 text-neutral-500" title="Timing below reliable resolution">
                        INCONCLUSIVE
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {res.resultSetsEqual && res.speedup !== null ? (
                      <span className={`font-bold ${
                        res.speedup >= 2.0 
                          ? 'text-emerald-400' 
                          : res.speedup >= 1.0 
                          ? 'text-cyan-400' 
                          : 'text-amber-400'
                      }`}>
                        {res.bitmapSubResolution ? `>${Math.floor(res.speedup)}x` : `${res.speedup.toFixed(1)}x`}
                      </span>
                    ) : (
                      <span className="text-neutral-500">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparative Performance Visualizer (Chart) */}
      {hasResults && (
        <div className="p-3 bg-neutral-950/80 rounded-md border border-neutral-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Execution Time Comparison
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-sm bg-amber-400" /> Table Scan
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-sm bg-cyan-400" /> Packed Bitmap
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            {activeSizes.map(size => {
              const res = results[size];
              if (!res) return null;

              const tsPct = Math.min(100, Math.max(3, (res.tableScanMedianMs / chartMaxTime) * 100));
              const bmPct = Math.min(100, Math.max(3, (res.bitmapMedianMs / chartMaxTime) * 100));

              return (
                <div key={size} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-12 text-neutral-400 shrink-0 text-right">{size >= 1000 ? `${size / 1000}k` : size}</span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    {/* Table Scan Bar */}
                    <div className="w-full bg-neutral-900 rounded-sm h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-amber-500/80 hover:bg-amber-400 transition-all rounded-sm flex items-center px-1 text-[8px] text-black font-bold whitespace-nowrap"
                        style={{ width: `${tsPct}%` }}
                      >
                        {formatTiming(res.tableScanMedianMs, res.tableScanSubResolution)}
                      </div>
                    </div>
                    {/* Bitmap Bar */}
                    <div className="w-full bg-neutral-900 rounded-sm h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-cyan-500/90 hover:bg-cyan-400 transition-all rounded-sm flex items-center px-1 text-[8px] text-black font-bold whitespace-nowrap"
                        style={{ width: `${bmPct}%` }}
                      >
                        {formatTiming(res.bitmapMedianMs, res.bitmapSubResolution)}
                      </div>
                    </div>
                  </div>
                  <span className="w-12 text-right shrink-0 font-bold text-emerald-400">
                    {res.resultSetsEqual && res.speedup !== null ? (res.bitmapSubResolution ? `>${Math.floor(res.speedup)}x` : `${res.speedup.toFixed(1)}x`) : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Index Construction & Break-Even Analysis Toggle */}
      <div className="border border-neutral-800 rounded-md overflow-hidden bg-neutral-950/40">
        <button
          onClick={() => setShowTechDetails(!showTechDetails)}
          className="w-full px-3 py-2 text-left text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>Dynamic Benchmark Technical Details &amp; Break-Even Analysis</span>
          </div>
          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
        </button>

        {showTechDetails && (
          <div className="p-3 border-t border-neutral-800/80 flex flex-col gap-3 text-xs">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              In a continuous smart city monitoring system, bitmap indexes are built once and reused across thousands of live queries.
              The table below isolates the one-time build cost, index RAM footprint, and the break-even query threshold for your currently selected query.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono">
                <thead className="text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="py-1">Rows</th>
                    <th 
                      className="py-1" 
                      title="Calibrated number of query iterations in each timed sample batch. Calibrated independently to achieve the 20–25ms duration target."
                    >
                      Calibrated Batch Size (TS / BM)
                    </th>
                    <th 
                      className="py-1" 
                      title="Estimated packed Uint32Array word payload storage (excludes JavaScript object wrappers, maps, and runtime heap overhead)."
                    >
                      Packed Bitmap Payload (Est.)
                    </th>
                    <th 
                      className="py-1" 
                      title="Robust median build time of independent index construction repetitions (dataset generation and warm-up excluded)."
                    >
                      1-Time Build (Median)
                    </th>
                    <th 
                      className="py-1 text-right" 
                      title="Math.ceil(buildTime / (tableScan - packedBitmap)). Calculated using unrounded full-precision measurements."
                    >
                      Break-Even Queries
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
                  {activeSizes.map(size => {
                    const res = results[size];
                    if (!res) return null;

                    return (
                      <tr key={size} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-1.5 text-white font-medium">{size.toLocaleString()}</td>
                        <td 
                          className="py-1.5 text-neutral-400" 
                          title={`Calibrated batch iterations: Table Scan = ${res.tableScanBatchSize?.toLocaleString() || '-'}, Packed Bitmap = ${res.bitmapBatchSize?.toLocaleString() || '-'}. Calibrated separately to obtain reliable 20–25ms timing intervals.`}
                        >
                          TS: {res.tableScanBatchSize?.toLocaleString() || '-'} / BM: {res.bitmapBatchSize?.toLocaleString() || '-'}
                        </td>
                        <td 
                          className="py-1.5 text-cyan-400 font-mono" 
                          title={`Raw Uint32Array buffer storage: ${res.indexMemoryBytes?.toLocaleString() || 0} bytes. Excludes JS object/heap overhead.`}
                        >
                          {formatMemoryPayload(res.indexMemoryBytes)}
                        </td>
                        <td 
                          className="py-1.5 text-amber-400 font-mono"
                          title={`Median of repeated independent index builds: ${res.indexBuildTimeMs ? res.indexBuildTimeMs.toFixed(3) : '-'} ms`}
                        >
                          {res.indexBuildTimeMs ? `${res.indexBuildTimeMs.toFixed(1)} ms` : 'N/A'}
                        </td>
                        <td className="py-1.5 text-right font-mono">
                          {!res.resultSetsEqual ? (
                            <span 
                              className="text-rose-400 font-bold" 
                              title={res.validationError || 'Result sets differ between Table Scan and Packed Bitmap'}
                            >
                              N/A (mismatch)
                            </span>
                          ) : res.tableScanSubResolution || res.bitmapSubResolution ? (
                            <span 
                              className="text-neutral-400" 
                              title="Timing measurement is below reliable timer resolution (<0.1 µs)"
                            >
                              N/A (inconclusive)
                            </span>
                          ) : res.tableScanMedianMs <= res.bitmapMedianMs ? (
                            <span 
                              className="text-amber-400" 
                              title="Packed Bitmap is not faster than Table Scan for this query workload"
                            >
                              No break-even (bitmap not faster)
                            </span>
                          ) : res.breakEvenQueries !== null && res.breakEvenQueries !== undefined ? (
                            <span 
                              className="text-white font-bold cursor-help hover:text-cyan-300 transition-colors underline decoration-dotted decoration-neutral-600"
                              title={`Break-Even Audit Details:\n• Index Build (Median): ${res.indexBuildTimeMs?.toFixed(4)} ms\n• Table Scan (Median): ${res.tableScanMedianMs.toFixed(5)} ms\n• Packed Bitmap (Median): ${res.bitmapMedianMs.toFixed(5)} ms\n• Time Saved / Query: ${(res.tableScanMedianMs - res.bitmapMedianMs).toFixed(5)} ms\n• Ratio: ${(res.indexBuildTimeMs! / (res.tableScanMedianMs - res.bitmapMedianMs)).toFixed(3)}\n• Break-Even = Math.ceil(Ratio) = ${res.breakEvenQueries} queries\n(Calculated using unrounded median measurements)`}
                            >
                              {res.breakEvenQueries.toLocaleString()} queries
                            </span>
                          ) : (
                            <span className="text-neutral-500">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 pt-1 text-[10px] text-neutral-400">
              <div className="p-2.5 rounded bg-blue-950/20 border border-blue-800/40 text-blue-200/90 leading-normal flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Break-Even Auditing &amp; Precision:</strong> Break-even is mathematically defined as <code className="text-cyan-300 font-mono">Math.ceil(indexBuildTime / (tableScanMedian - bitmapMedian))</code> and is calculated using full-precision unrounded median measurements. Displayed table times are formatted for readability (e.g. 1.36 ms vs 1.354 ms), which can cause slight differences if recalculated from display-rounded numbers. Hover over any Break-Even value to view the unrounded numbers and exact ratio.
                </div>
              </div>
              <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800/80 text-neutral-300 leading-normal flex items-start gap-2">
                <HardDrive className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div><strong>Measurement Methodology:</strong></div>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-400">
                    <li><strong>Calibrated Batch Size (TS / BM):</strong> Because Table Scan and Packed Bitmap queries run at vastly different speeds, batch sizes are calibrated independently to 20–25 ms intervals to eliminate timer quantization noise without freezing the UI. Reported values represent the calibrated batch size per sample, not total benchmark executions.</li>
                    <li><strong>Packed Bitmap Payload (Est.):</strong> Estimates raw <code className="text-neutral-300 font-mono">Uint32Array</code> word buffer allocations for all indexed category bitvectors. Excludes JavaScript object wrappers, maps, and runtime heap overhead.</li>
                    <li><strong>1-Time Build (Median):</strong> Measured across repeated independent index builds with unmeasured warm-up to filter out garbage collection pauses and JIT compilation noise. Dataset generation is strictly excluded.</li>
                  </ul>
                </div>
              </div>
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-[10px] text-emerald-200/90 leading-normal flex items-start gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Shared State Architecture:</strong> The Scaling Experiment is bound directly to the Performance Lab's District and Issue filters in <code className="text-emerald-300 font-mono">useCityStore</code>. Both Table Scan and Packed Bitmap Index evaluate the exact same dynamically generated AST across the full synthetic dataset.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
