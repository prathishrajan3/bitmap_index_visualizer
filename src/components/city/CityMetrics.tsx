"use client";

import { CityBenchmarkComparison } from '@/lib/city/cityStatistics';
import { Clock, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

import CityTooltip from './ui/CityTooltip';

export default function CityMetrics({ benchmark }: { benchmark: CityBenchmarkComparison }) {
  if (!benchmark) return null;

  const { tableScan, bitmap, speedup } = benchmark;
  const matchCount = bitmap.metrics.matchingRows;
  
  const tsTime = tableScan.executionTimeMs < 0.01 ? '<0.01' : tableScan.executionTimeMs.toFixed(2);
  const bmTime = bitmap.metrics.executionTimeMs < 0.01 ? '<0.01' : bitmap.metrics.executionTimeMs.toFixed(2);

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Large Match Count */}
      <div className="flex flex-col gap-1 items-center justify-center p-6 bg-[#111115] border border-emerald-500/20 rounded-lg shadow-inner">
        <div className="text-4xl font-bold text-emerald-400 font-mono tracking-tight">
          {matchCount.toLocaleString()}
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 font-semibold mt-1">
          Matching Entities
        </div>
        
        {/* Technical query stats compactly below */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-800/60 w-full justify-center">
          <CityTooltip content="Bitmap vectors representing indexed categorical values.">
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-neutral-300">{bitmap.metrics.bitmapVectorsUsed}</span>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Vectors</span>
            </div>
          </CityTooltip>
          
          <div className="h-6 w-px bg-neutral-800/60"></div>
          
          <CityTooltip content="Boolean bitmap operations used to combine query conditions.">
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-neutral-300">{bitmap.metrics.operationsPerformed.length}</span>
              <span className="text-[9px] uppercase tracking-wider text-neutral-500">Operations</span>
            </div>
          </CityTooltip>
          
          <div className="h-6 w-px bg-neutral-800/60"></div>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-mono text-emerald-400">{bmTime} ms</span>
            <span className="text-[9px] uppercase tracking-wider text-neutral-500">Time</span>
          </div>
        </div>
      </div>

      {/* 2. Performance Comparison */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
          6. Performance
        </label>
        <p className="text-[10px] text-neutral-500 mb-2 leading-tight">
          Same query executed using both approaches.
        </p>
        
        <div className="bg-[#151518] p-4 border border-neutral-800 rounded-lg flex flex-col gap-4">
          
          {/* Table Scan */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <CityTooltip content="Iterates over every entity in the database sequentially.">
                <span className="text-neutral-400 flex items-center gap-1.5 cursor-help"><Clock className="w-3.5 h-3.5" /> Table Scan</span>
              </CityTooltip>
              <span className="font-mono text-neutral-300">{tsTime} ms</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-500 w-full rounded-full"></div>
            </div>
          </div>

          {/* Bitmap */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <CityTooltip content="Uses bitwise operations on categorical vectors for instant results.">
                <span className="text-emerald-400 flex items-center gap-1.5 cursor-help"><Zap className="w-3.5 h-3.5" /> Bitmap Index</span>
              </CityTooltip>
              <span className="font-mono text-emerald-400 font-bold">{bmTime} ms</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max((bitmap.metrics.executionTimeMs / tableScan.executionTimeMs) * 100, 2)}%` }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"
              />
            </div>
          </div>
          
          {/* Speedup Box */}
          <div className="mt-2 flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
            <span className="text-[10px] font-semibold text-emerald-500/80 uppercase tracking-widest">
              Speedup
            </span>
            <CityTooltip content="Table Scan time divided by Bitmap Index execution time." position="left">
              <div className="flex items-center gap-2 cursor-help">
                <span className="text-sm font-black text-emerald-400 tracking-wider">{speedup}×</span>
                <span className="text-[10px] text-emerald-500/60 uppercase">Faster</span>
              </div>
            </CityTooltip>
          </div>
          
        </div>
      </div>
    </div>
  );
}
