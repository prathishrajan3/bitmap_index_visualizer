"use client";

import React, { useState } from 'react';
import { generateCityData } from '@/lib/city/cityGenerator';
import { buildCityBitmapIndex } from '@/lib/city/cityBitmapEngine';
import { runRepeatedCityBenchmark, CityBenchmarkStatistics } from '@/lib/city/cityStatistics';
import { CityQueryNode } from '@/lib/city/cityTypes';
import { Play, Activity, Database, CheckCircle2 } from 'lucide-react';

const SCALING_SIZES = [2000, 5000, 10000, 20000, 30000];

export function CityScalingBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<number, CityBenchmarkStatistics>>({});
  const [currentSize, setCurrentSize] = useState<number | null>(null);

  const runScalingExperiment = async () => {
    setIsRunning(true);
    setResults({});
    
    // A deterministic complex query
    const benchmarkAst: CityQueryNode = {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: 'Central Business District' },
      right: {
        type: 'logical',
        operator: 'OR',
        left: { type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' },
        right: { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' }
      }
    };

    try {
      for (const size of SCALING_SIZES) {
        setCurrentSize(size);
        
        // Yield to browser UI thread
        await new Promise(r => setTimeout(r, 100));

        // Generate isolated deterministic benchmark dataset
        const testData = generateCityData({ seed: 999, count: size, timeOfDay: 'Morning', weather: 'Clear', scenario: 'None' });
        const testIndex = buildCityBitmapIndex(testData);

        const stats = runRepeatedCityBenchmark(benchmarkAst, testData, testIndex, 5, 10);
        
        setResults(prev => ({ ...prev, [size]: stats }));
      }
    } catch (e) {
      console.error("Scaling test error:", e);
    } finally {
      setIsRunning(false);
      setCurrentSize(null);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 bg-neutral-900 border-t border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Scaling Experiment
          </h3>
          <p className="text-[10px] text-neutral-500 mt-1">Tests execution time as dataset grows deterministically.</p>
        </div>
        <button 
          onClick={runScalingExperiment}
          disabled={isRunning}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isRunning ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-3 h-3" />}
          Run Scaling Test
        </button>
      </div>

      <div className="w-full overflow-x-auto border border-neutral-800 rounded-md bg-[#0a0a0c]">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-800/50 text-[10px] uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Rows</th>
              <th className="px-3 py-2 font-medium">Table Scan</th>
              <th className="px-3 py-2 font-medium">Bitmap</th>
              <th className="px-3 py-2 font-medium">Matches</th>
              <th className="px-3 py-2 font-medium text-right">Speedup</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50 font-mono">
            {SCALING_SIZES.map(size => {
              const res = results[size];
              const isCurrent = currentSize === size;
              
              if (isCurrent) {
                return (
                  <tr key={size} className="bg-emerald-500/5">
                    <td className="px-3 py-3 text-neutral-300">{size.toLocaleString()}</td>
                    <td colSpan={4} className="px-3 py-3 text-emerald-500/70 text-center animate-pulse">Running benchmark...</td>
                  </tr>
                );
              }

              if (!res) {
                return (
                  <tr key={size}>
                    <td className="px-3 py-2 text-neutral-600">{size.toLocaleString()}</td>
                    <td className="px-3 py-2 text-neutral-700">-</td>
                    <td className="px-3 py-2 text-neutral-700">-</td>
                    <td className="px-3 py-2 text-neutral-700">-</td>
                    <td className="px-3 py-2 text-neutral-700 text-right">-</td>
                  </tr>
                );
              }

              return (
                <tr key={size}>
                  <td className="px-3 py-2 text-neutral-300">{size.toLocaleString()}</td>
                  <td className="px-3 py-2 text-amber-400">{res.tableScanMedianMs.toFixed(2)} ms</td>
                  <td className="px-3 py-2 text-blue-400">{res.bitmapMedianMs.toFixed(2)} ms</td>
                  <td className="px-3 py-2 text-emerald-400 flex items-center gap-1">
                    {res.matchingRows.toLocaleString()} {res.resultSetsEqual && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  </td>
                  <td className="px-3 py-2 text-white text-right font-bold">
                    {res.speedup ? res.speedup.toFixed(2) + 'x' : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
