import React, { useState, useEffect } from 'react';
import { Bitmap, DatasetRow } from '@/lib/bitmap';
import { Play, Pause, SkipBack, SkipForward, ChevronRight } from 'lucide-react';

interface BitmapBuilderProps {
  dataset: DatasetRow[];
  bitmap: Bitmap;
}

export function BitmapBuilder({ dataset, bitmap }: BitmapBuilderProps) {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  
  const totalSteps = bitmap.length; // One step per row

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && step < totalSteps) {
      interval = setInterval(() => {
        setStep(s => s + 1);
      }, 500); // 500ms per step
    } else if (step >= totalSteps) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, totalSteps]);

  // Derive the current state of the bits based on the step
  const currentBits = bitmap.bits.slice(0, step);
  const padding = Array(totalSteps - step).fill(null);
  const displayBits = [...currentBits, ...padding];

  const currentRow = step < totalSteps ? dataset[step] : null;
  const isMatch = currentRow ? String(currentRow[bitmap.sourceColumn]) === String(bitmap.sourceValue) : false;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Controls */}
      <div className="flex items-center justify-between bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setStep(0); setIsPlaying(false); }}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-neutral-300"
            disabled={step === 0}
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors text-white w-10 flex items-center justify-center"
            disabled={step === totalSteps}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          
          <button 
            onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-neutral-300"
            disabled={step === totalSteps}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm font-mono text-neutral-400">
          Step: <span className="text-white">{step}</span> / {totalSteps}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Row Inspection */}
        <div className="space-y-4 border border-neutral-800 rounded bg-neutral-900/30 p-4 relative h-64 flex flex-col justify-center">
          {step === totalSteps ? (
            <div className="text-center text-emerald-400 font-bold">Construction Complete!</div>
          ) : currentRow ? (
            <div className="space-y-6">
              <div className="text-center text-xs text-neutral-500 uppercase tracking-widest">Scanning Table</div>
              
              <div className="flex justify-center items-center gap-4">
                <div className="bg-neutral-800 px-4 py-2 rounded text-sm text-neutral-300">
                  Row ID: <span className="text-white font-mono">{currentRow.id}</span>
                </div>
                <ChevronRight className="text-neutral-600" />
                <div className="bg-neutral-800 px-4 py-2 rounded text-sm text-neutral-300">
                  {bitmap.sourceColumn}: <span className="text-white font-bold">{String(currentRow[bitmap.sourceColumn])}</span>
                </div>
              </div>

              <div className="text-center border-t border-neutral-800 pt-6">
                <div className="text-xs text-neutral-500 mb-2">Predicate Match</div>
                <div className="text-sm font-medium flex items-center justify-center gap-2">
                  <span className="text-neutral-400">{String(currentRow[bitmap.sourceColumn])}</span>
                  <span className="text-neutral-600">==</span>
                  <span className="text-blue-400">{String(bitmap.sourceValue)}</span>
                  <span className="text-neutral-600">?</span>
                  
                  {isMatch ? (
                    <span className="text-emerald-400 font-bold ml-2">YES → 1</span>
                  ) : (
                    <span className="text-neutral-500 font-bold ml-2">NO → 0</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-neutral-600">Click Play to begin scan.</div>
          )}
        </div>

        {/* Right: Bitmap Construction */}
        <div className="space-y-4 border border-neutral-800 rounded bg-neutral-900/30 p-4 h-64 overflow-y-auto custom-scrollbar">
          <div className="text-xs text-neutral-500 uppercase tracking-widest sticky top-0 bg-neutral-900/90 py-1 mb-2">
            Constructing Vector
          </div>
          
          <div className="flex flex-wrap gap-1">
            {displayBits.map((bit, idx) => {
              const isCurrent = idx === step - 1;
              return (
                <div
                  key={idx}
                  title={`Row ID: ${idx + 1}`}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-sm font-mono transition-all duration-300
                    ${bit === null 
                      ? 'bg-neutral-950 border border-neutral-800 text-transparent' 
                      : bit === 1
                        ? isCurrent ? 'bg-emerald-500 text-white scale-125 shadow-[0_0_10px_rgba(16,185,129,0.8)] z-10' : 'bg-blue-500/40 text-blue-200'
                        : isCurrent ? 'bg-neutral-600 text-white scale-125 z-10' : 'bg-neutral-800 text-neutral-600'
                    }
                  `}
                >
                  {bit !== null ? bit : '-'}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
