"use client";

import { useMemo } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { executeCityQuery } from '@/lib/city/cityQueries';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Database, Cpu } from 'lucide-react';
import CityTooltip from './ui/CityTooltip';

export default function BitmapQueryVisualizer() {
  const { activeQuery, dataset, bitmapIndex } = useCityStore();

  const executionResult = useMemo(() => {
    if (!activeQuery || dataset.length === 0) return null;
    const ids = dataset.map(e => e.id);
    return executeCityQuery(activeQuery, bitmapIndex, dataset.length, ids);
  }, [activeQuery, dataset, bitmapIndex]);

  if (!executionResult) return null;

  return (
    <div className="bg-[#111115] border border-neutral-800 rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-emerald-400 to-emerald-500/20"></div>
      
      <p className="text-[10px] text-neutral-400 leading-relaxed bg-[#151518] p-3 rounded border border-neutral-800/50">
        <span className="text-emerald-400 font-semibold">Bitmap Index</span>: Each categorical value is represented as a bit vector. Queries combine these vectors using fast Boolean bitwise operations (AND, OR, NOT).
      </p>

      <div className="flex flex-col gap-2 relative">
        <AnimatePresence>
          {executionResult.steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="relative flex flex-col"
            >
              {idx > 0 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="w-3 h-3 text-neutral-600" />
                </div>
              )}
              <div className="bg-[#151518] border border-neutral-800 rounded p-3 flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-neutral-800 flex items-center justify-center text-[9px] text-emerald-400 font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="text-xs text-neutral-300 font-medium leading-tight">
                    {step.description}
                  </div>
                </div>
                
                {/* Visual Bitmap Representation */}
                <CityTooltip content="A segment of the actual bit vector. 1 means match, 0 means no match.">
                  <div className="ml-6 flex gap-[1px] h-2.5 w-full cursor-help">
                    {step.resultBitmap.bits.slice(0, 50).map((bit, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 ${bit === 1 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-neutral-800'}`} 
                      />
                    ))}
                    {step.resultBitmap.bits.length > 50 && (
                      <div className="text-[8px] text-neutral-500 ml-1">...</div>
                    )}
                  </div>
                </CityTooltip>
                
                <div className="ml-6 flex justify-between mt-0.5 text-[9px] uppercase tracking-wider text-neutral-500">
                  <span>Bits</span>
                  <span className="text-emerald-500/70">{step.resultBitmap.setBitCount} matches</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="mt-2 pt-3 border-t border-neutral-800 flex justify-between items-center bg-emerald-500/10 p-3 rounded border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
            Final Result
          </span>
        </div>
        <div className="text-xs font-mono text-emerald-300 font-bold">
          {executionResult.finalBitmap.setBitCount} MATCHES
        </div>
      </div>
    </div>
  );
}
