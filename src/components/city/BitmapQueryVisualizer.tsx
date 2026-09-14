"use client";

import { useMemo } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { executeCityQuery } from '@/lib/city/cityQueries';
import { motion, AnimatePresence } from 'framer-motion';

export default function BitmapQueryVisualizer() {
  const { activeQuery, dataset, bitmapIndex } = useCityStore();

  const executionResult = useMemo(() => {
    if (!activeQuery || dataset.length === 0) return null;
    const ids = dataset.map(e => e.id);
    return executeCityQuery(activeQuery, bitmapIndex, dataset.length, ids);
  }, [activeQuery, dataset, bitmapIndex]);

  if (!executionResult) return null;

  return (
    <div className="bg-[#0d0d0f]/90 backdrop-blur-md border border-emerald-500/30 rounded-lg p-4 shadow-2xl overflow-hidden flex flex-col gap-3">
      <div className="text-xs font-bold text-emerald-400 tracking-wider flex justify-between items-center">
        <span>BITMAP PIPELINE EXECUTION</span>
        <span className="bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
          {executionResult.metrics.executionTimeMs.toFixed(2)}ms
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {executionResult.steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#151518] border border-neutral-800 rounded p-2 text-xs"
            >
              <div className="text-neutral-400 mb-1">{step.description}</div>
              
              {/* Bit visualizer (show first 40 bits) */}
              <div className="flex gap-[1px] h-2 w-full">
                {step.resultBitmap.bits.slice(0, 40).map((bit, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 ${bit === 1 ? 'bg-emerald-500' : 'bg-neutral-800'}`} 
                  />
                ))}
                {step.resultBitmap.bits.length > 40 && (
                  <div className="text-[8px] text-neutral-500 ml-1">...</div>
                )}
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-neutral-500">
                <span>0</span>
                <span>{step.resultBitmap.setBitCount} matches</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="pt-2 border-t border-emerald-500/20">
        <div className="text-[10px] text-emerald-400 font-mono">
          FINAL MATCHES: {executionResult.finalBitmap.setBitCount}
        </div>
      </div>
    </div>
  );
}
