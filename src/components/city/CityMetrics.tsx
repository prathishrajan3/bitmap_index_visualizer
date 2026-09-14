"use client";

import { CityBenchmarkComparison } from '@/lib/city/cityStatistics';
import { Clock, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CityMetrics({ benchmark }: { benchmark: CityBenchmarkComparison }) {
  if (!benchmark) return null;

  const { tableScan, bitmap, speedup } = benchmark;
  const matchCount = bitmap.metrics.matchingRows;
  
  // Format times specifically for display. Bitmap often comes in under 0.1ms
  const tsTime = tableScan.executionTimeMs < 0.01 ? '<0.01' : tableScan.executionTimeMs.toFixed(2);
  const bmTime = bitmap.metrics.executionTimeMs < 0.01 ? '<0.01' : bitmap.metrics.executionTimeMs.toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      {/* Speedup Highlight */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <Zap className="w-4 h-4 fill-emerald-400" />
          <span className="font-bold tracking-wider">BITMAP SPEEDUP</span>
        </div>
        <div className="text-3xl font-black text-emerald-300">
          {speedup}x
        </div>
        <p className="text-[10px] text-emerald-500/70 mt-1 uppercase tracking-widest">Faster than Table Scan</p>
      </div>

      {/* Row matches */}
      <div className="flex items-center justify-between p-3 bg-[#151518] rounded-md border border-neutral-800">
        <div className="flex items-center gap-2 text-neutral-400">
          <Target className="w-4 h-4" />
          <span>Matches</span>
        </div>
        <span className="font-mono text-white font-bold">{matchCount.toLocaleString()} <span className="text-neutral-500 text-xs font-sans font-normal">entities</span></span>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-3">
        {/* Table Scan */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Table Scan</span>
            <span className="font-mono text-neutral-300">{tsTime} ms</span>
          </div>
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-neutral-500 w-full rounded-full"></div>
          </div>
        </div>

        {/* Bitmap */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Bitmap Index</span>
            <span className="font-mono text-emerald-400 font-bold">{bmTime} ms</span>
          </div>
          <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.max((bitmap.metrics.executionTimeMs / tableScan.executionTimeMs) * 100, 2)}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>
      
      {/* Engine stats */}
      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase tracking-wider text-neutral-500 mt-2">
        <div className="bg-[#151518] p-2 rounded border border-neutral-800">
          Vectors: <span className="text-neutral-300">{bitmap.metrics.bitmapVectorsUsed}</span>
        </div>
        <div className="bg-[#151518] p-2 rounded border border-neutral-800 truncate" title={bitmap.metrics.operationsPerformed.join(', ')}>
          Ops: <span className="text-neutral-300">{bitmap.metrics.operationsPerformed.length}</span>
        </div>
      </div>
    </div>
  );
}
