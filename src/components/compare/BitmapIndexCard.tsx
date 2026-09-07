import React from 'react';
import { Layers, ArrowDown, Zap, Activity } from 'lucide-react';
import { CompareMetrics } from '@/lib/compareEngine';

interface BitmapIndexCardProps {
  metrics: CompareMetrics;
  vectorsUsed: {col: string, val: string, bits: number[]}[];
  finalBits: number[];
  logic: 'AND' | 'OR' | 'NONE';
}

export function BitmapIndexCard({ metrics, vectorsUsed, finalBits, logic }: BitmapIndexCardProps) {
  
  // Format bit array for display
  const renderBits = (bits: number[]) => {
    // If the dataset is huge, slice to first 20 bits
    const maxDisplay = 20;
    const isTruncated = bits.length > maxDisplay;
    const displayBits = bits.slice(0, maxDisplay);
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {displayBits.map((b, i) => (
          <span 
            key={i} 
            className={`w-4 h-4 flex items-center justify-center text-[10px] font-bold rounded ${b === 1 ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-500'}`}
          >
            {b}
          </span>
        ))}
        {isTruncated && <span className="text-xs text-neutral-500 ml-1">... ({bits.length} total)</span>}
      </div>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
        <div className="p-3 bg-blue-900/20 rounded-lg text-blue-400">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Bitmap Index Execution</h2>
          <p className="text-sm text-neutral-500">Combine bitmap vectors to identify candidate rows before fetching.</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        
        {/* Vector Visualization */}
        {vectorsUsed.length > 0 ? (
          <div className="bg-neutral-950 rounded-lg p-4 font-mono text-sm border border-neutral-800/50">
            <div className="text-neutral-500 mb-4 font-bold tracking-widest text-xs uppercase">Bitmap Operations</div>
            
            <div className="space-y-3">
              {vectorsUsed.map((v, idx) => (
                <div key={`${v.col}-${idx}`} className="bg-neutral-900 p-2 rounded border border-neutral-800">
                  <div className="text-xs text-blue-300">INDEX: {v.col} = {v.val}</div>
                  {renderBits(v.bits)}
                </div>
              ))}
              
              {vectorsUsed.length > 1 && (
                <>
                  <div className="flex justify-center my-2">
                    <div className="bg-emerald-900/30 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-900/50 font-bold">
                      Bitwise {logic}
                    </div>
                  </div>
                  <div className="bg-emerald-900/10 p-2 rounded border border-emerald-900/30">
                    <div className="text-xs text-emerald-400 font-bold">Result Bitmap</div>
                    {renderBits(finalBits)}
                  </div>
                </>
              )}

              <div className="flex flex-col items-center gap-1 mt-4">
                <ArrowDown className="w-4 h-4 text-neutral-600 my-1" />
                <div className="bg-purple-900/20 text-purple-400 px-4 py-1.5 rounded w-full text-center border border-purple-900/50 text-xs">
                  Extract Row IDs ({metrics.bitmapCandidateRows} candidates)
                </div>
                <ArrowDown className="w-4 h-4 text-neutral-600 my-1" />
                <div className="bg-red-900/20 text-red-400 px-4 py-1.5 rounded w-full text-center border border-red-900/50 text-xs">
                  Heap Table Fetch
                </div>
              </div>
            </div>
          </div>
        ) : (
           <div className="bg-neutral-950 rounded-lg p-4 font-mono text-sm border border-neutral-800/50 text-neutral-500 italic text-center">
             No predicates to index. A full table scan will be forced.
           </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/50">
            <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Heap Fetches</div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.bitmapCandidateRows}</div>
            <div className="text-xs text-neutral-500 mt-2">rows actually loaded from table</div>
          </div>
          
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/50">
            <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Bitwise Ops</div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.bitmapOperations}</div>
            <div className="text-xs text-neutral-500 mt-2">logical vector combinations</div>
          </div>
        </div>

        <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg">
          <div className="flex gap-2 items-start text-blue-400">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Why this matters:</strong> Bitwise operations are extremely fast at the CPU level. By combining bitmaps first, the database avoids fetching the physical rows that do not meet the criteria, potentially saving massive amounts of disk I/O.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
