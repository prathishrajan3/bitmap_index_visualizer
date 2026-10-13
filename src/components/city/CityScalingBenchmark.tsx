"use client";

import React, { useState } from 'react';
import { generateCityData } from '@/lib/city/cityGenerator';
import { buildCityBitmapIndex } from '@/lib/city/cityBitmapEngine';
import { runRepeatedCityBenchmark, CityBenchmarkStatistics } from '@/lib/city/cityStatistics';
import { estimatePackedIndexBytes } from '@/lib/city/packedBitmap';
import { CityQueryNode } from '@/lib/city/cityTypes';
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
  ChevronUp
} from 'lucide-react';

interface WorkloadDefinition {
  id: string;
  name: string;
  label: string;
  selectivity: string;
  description: string;
  ast: CityQueryNode;
}

const WORKLOADS: WorkloadDefinition[] = [
  {
    id: 'workload_a',
    name: 'Workload A: Complex District Alarm',
    label: 'A: Complex CBD',
    selectivity: '~2.5% Selectivity',
    description: "district = 'Central Business District' AND (trafficLevel = 'Severe' OR riskLevel = 'Critical')",
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    }
  },
  {
    id: 'workload_b',
    name: 'Workload B: Selective Emergency Dispatch',
    label: 'B: Selective Fire',
    selectivity: '~0.3% Selectivity',
    description: "incidentType = 'Fire' AND emergencyPriority = 'Critical'",
    ast: {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'incidentType', operator: '=', value: 'Fire' },
      right: { type: 'predicate', column: 'emergencyPriority', operator: '=', value: 'Critical' }
    }
  },
  {
    id: 'workload_c',
    name: 'Workload C: Broad Road Grid Analysis',
    label: 'C: Broad Grid',
    selectivity: '~40.0% Selectivity',
    description: "trafficLevel = 'Severe' OR roadType = 'Arterial'",
    ast: {
      type: 'logical',
      operator: 'OR',
      left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
      right: { type: 'predicate', column: 'roadType', operator: '=', value: 'Arterial' }
    }
  }
];

const STANDARD_SIZES = [2000, 5000, 10000, 20000, 30000];
const EXTENDED_SIZES = [2000, 5000, 10000, 20000, 30000, 50000, 100000, 250000];

export function CityScalingBenchmark() {
  const [selectedWorkload, setSelectedWorkload] = useState<string>('workload_a');
  const [useExtendedSuite, setUseExtendedSuite] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<Record<number, CityBenchmarkStatistics>>({});
  const [currentSize, setCurrentSize] = useState<number | null>(null);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  const activeWorkload = WORKLOADS.find(w => w.id === selectedWorkload) || WORKLOADS[0];
  const activeSizes = useExtendedSuite ? EXTENDED_SIZES : STANDARD_SIZES;

  const runScalingExperiment = async () => {
    setIsRunning(true);
    setResults({});

    try {
      for (const size of activeSizes) {
        setCurrentSize(size);
        
        // Yield to browser UI thread to allow animation and progress update
        await new Promise(r => setTimeout(r, 40));

        // Generate isolated deterministic benchmark dataset
        const dataStart = performance.now();
        const testData = generateCityData({ seed: 999, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
        const genTimeMs = performance.now() - dataStart;

        // Build packed bitmap index outside of query execution measurement
        const buildStart = performance.now();
        const testIndex = buildCityBitmapIndex(testData);
        const buildTimeMs = performance.now() - buildStart;

        // Calculate packed index memory
        const memoryBytes = estimatePackedIndexBytes(testIndex, size);

        // Run repeated benchmark with warm-ups, alternating order, and adaptive batching
        const stats = runRepeatedCityBenchmark(
          activeWorkload.ast, 
          testData, 
          testIndex, 
          5, 
          15, 
          buildTimeMs, 
          memoryBytes
        );
        
        setResults(prev => ({ ...prev, [size]: stats }));
      }
    } catch (e) {
      console.error("Scaling test error:", e);
    } finally {
      setIsRunning(false);
      setCurrentSize(null);
    }
  };

  // Find maximum execution time for SVG bar chart scaling
  const chartMaxTime = Math.max(
    ...Object.values(results).map(r => Math.max(r.tableScanMedianMs, r.bitmapMedianMs)),
    0.5
  );

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
              Compare 32-bit Packed Bitmap vs. Short-Circuit Table Scan across scales.
            </p>
          </div>
          <button 
            onClick={runScalingExperiment}
            disabled={isRunning}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isRunning ? (
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

        {/* Workload Selector Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-md border border-neutral-800 text-[10px]">
          {WORKLOADS.map(w => (
            <button
              key={w.id}
              onClick={() => {
                if (!isRunning) {
                  setSelectedWorkload(w.id);
                  setResults({});
                }
              }}
              disabled={isRunning}
              className={`flex-1 py-1 px-2 rounded font-medium transition-all text-center ${
                selectedWorkload === w.id 
                  ? 'bg-neutral-800 text-white shadow-sm font-semibold text-emerald-400 border border-neutral-700/60' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Workload Metadata & Suite Range */}
        <div className="flex items-center justify-between bg-neutral-950/60 px-2.5 py-1.5 rounded border border-neutral-800/80 text-[10px]">
          <div className="flex items-center gap-2 text-neutral-400 truncate mr-2">
            <span className="font-mono text-cyan-400 font-semibold">{activeWorkload.selectivity}</span>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-neutral-300 truncate" title={activeWorkload.description}>
              {activeWorkload.description}
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-[10px] text-neutral-400 shrink-0 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={useExtendedSuite}
              onChange={(e) => {
                if (!isRunning) {
                  setUseExtendedSuite(e.target.checked);
                  setResults({});
                }
              }}
              disabled={isRunning}
              className="rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 w-3 h-3"
            />
            <span>250K Scale</span>
          </label>
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
                      Measuring 15 iterations with warm-ups...
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

              const isBmWinner = res.winner === 'bitmap';
              const isTsWinner = res.winner === 'table_scan';

              return (
                <tr key={size} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-3 py-2 text-neutral-200 font-medium">{size.toLocaleString()}</td>
                  <td className="px-3 py-2 text-amber-400">
                    {res.tableScanMedianMs < 0.01 
                      ? `${(res.tableScanMedianMs * 1000).toFixed(0)} µs`
                      : `${res.tableScanMedianMs.toFixed(2)} ms`}
                  </td>
                  <td className="px-3 py-2 text-cyan-400">
                    {res.bitmapMedianMs < 0.01 
                      ? `${(res.bitmapMedianMs * 1000).toFixed(0)} µs`
                      : `${res.bitmapMedianMs.toFixed(2)} ms`}
                  </td>
                  <td className="px-3 py-2 text-neutral-300">
                    <div className="flex items-center gap-1">
                      <span>{res.matchingRows.toLocaleString()}</span>
                      {res.resultSetsEqual && (
                        <span title="Result sets 100% identical">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isBmWinner && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        BITMAP
                      </span>
                    )}
                    {isTsWinner && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        SCAN
                      </span>
                    )}
                    {res.winner === 'tie' && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-800 text-neutral-400">
                        TIE
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {res.speedup ? (
                      <span className={`font-bold ${
                        res.speedup >= 2.0 
                          ? 'text-emerald-400' 
                          : res.speedup >= 1.0 
                          ? 'text-cyan-400' 
                          : 'text-amber-400'
                      }`}>
                        {res.speedup.toFixed(1)}x
                      </span>
                    ) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparative Performance Visualizer (Chart) */}
      {Object.keys(results).length > 0 && (
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

              const tsPct = Math.min(100, Math.max(4, (res.tableScanMedianMs / chartMaxTime) * 100));
              const bmPct = Math.min(100, Math.max(4, (res.bitmapMedianMs / chartMaxTime) * 100));

              return (
                <div key={size} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-12 text-neutral-400 shrink-0 text-right">{size >= 1000 ? `${size / 1000}k` : size}</span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    {/* Table Scan Bar */}
                    <div className="w-full bg-neutral-900 rounded-sm h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-amber-500/80 hover:bg-amber-400 transition-all rounded-sm flex items-center px-1 text-[8px] text-black font-bold"
                        style={{ width: `${tsPct}%` }}
                      >
                        {res.tableScanMedianMs >= 0.05 && `${res.tableScanMedianMs.toFixed(1)}ms`}
                      </div>
                    </div>
                    {/* Bitmap Bar */}
                    <div className="w-full bg-neutral-900 rounded-sm h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-cyan-500/90 hover:bg-cyan-400 transition-all rounded-sm flex items-center px-1 text-[8px] text-black font-bold"
                        style={{ width: `${bmPct}%` }}
                      >
                        {res.bitmapMedianMs >= 0.05 && `${res.bitmapMedianMs.toFixed(1)}ms`}
                      </div>
                    </div>
                  </div>
                  <span className="w-12 text-right shrink-0 font-bold text-emerald-400">
                    {res.speedup ? `${res.speedup.toFixed(1)}x` : ''}
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
            <span>Index Overhead &amp; Break-Even Query Analysis</span>
          </div>
          {showTechDetails ? <ChevronUp className="w-3.5 h-3.5 text-neutral-500" /> : <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />}
        </button>

        {showTechDetails && (
          <div className="p-3 border-t border-neutral-800/80 flex flex-col gap-3 text-xs">
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              In a continuous smart city monitoring system, bitmap indexes are built once and reused across thousands of live queries.
              The table below isolates the one-time build cost, index RAM footprint, and the break-even query threshold.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] font-mono">
                <thead className="text-neutral-500 border-b border-neutral-800">
                  <tr>
                    <th className="py-1">Rows</th>
                    <th className="py-1">Index RAM (Est.)</th>
                    <th className="py-1">1-Time Build</th>
                    <th className="py-1">Per-Query Savings</th>
                    <th className="py-1 text-right">Break-Even Queries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
                  {activeSizes.map(size => {
                    const res = results[size];
                    if (!res) return null;
                    const savingsMs = res.tableScanMedianMs - res.bitmapMedianMs;
                    const memKb = res.indexMemoryBytes ? Math.round(res.indexMemoryBytes / 1024) : 0;

                    return (
                      <tr key={size}>
                        <td className="py-1 text-white font-medium">{size.toLocaleString()}</td>
                        <td className="py-1 text-cyan-400">{memKb} KB</td>
                        <td className="py-1 text-amber-400">{res.indexBuildTimeMs ? `${res.indexBuildTimeMs.toFixed(1)} ms` : 'N/A'}</td>
                        <td className="py-1 text-emerald-400">{savingsMs > 0 ? `+${savingsMs.toFixed(2)} ms` : 'N/A'}</td>
                        <td className="py-1 text-right font-bold text-white">
                          {res.breakEvenQueries ? `${res.breakEvenQueries} queries` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-[10px] text-emerald-200/90 leading-normal flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong>Architectural Insight:</strong> Bitmaps process 32 records per CPU instruction via packed <code className="text-emerald-300 font-mono">Uint32Array</code> word operations (<code className="text-emerald-300 font-mono">words[i] &amp; words2[i]</code>). Set-bit extraction skips empty 32-record words in a single check (<code className="text-emerald-300 font-mono">if (word === 0) continue</code>), eliminating millions of row-by-row predicate branch mispredictions.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
