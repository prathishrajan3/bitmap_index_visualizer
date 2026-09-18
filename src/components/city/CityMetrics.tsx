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

    </div>
  );
}
