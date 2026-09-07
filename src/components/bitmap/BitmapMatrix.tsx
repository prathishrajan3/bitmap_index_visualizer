import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Bitmap } from '@/lib/bitmap';

interface BitmapMatrixProps {
  bitmap: Bitmap;
  onBitClick?: (rowId: number) => void;
  activeRowId?: number | null;
}

export function BitmapMatrix({ bitmap, onBitClick, activeRowId }: BitmapMatrixProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = bitmap.length;

  // We are going to display bits as a matrix. 
  // e.g. 20 bits per row in the UI to make it fit nicely.
  const bitsPerRow = 20;
  const virtualRowCount = Math.ceil(rowCount / bitsPerRow);

  const rowVirtualizer = useVirtualizer({
    count: virtualRowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // 24px height per row
    overscan: 5,
  });

  return (
    <div className="flex flex-col space-y-2 border border-neutral-800 rounded p-4 bg-neutral-900/50">
      <div className="flex justify-between items-center text-xs text-neutral-400 border-b border-neutral-800 pb-2">
        <span className="font-mono text-blue-400">Column: {bitmap.sourceColumn}</span>
        <span className="font-mono text-amber-400">Value: {String(bitmap.sourceValue)}</span>
        <span>{bitmap.setBitCount} / {bitmap.length} bits</span>
      </div>

      <div 
        ref={parentRef} 
        className="h-64 overflow-auto custom-scrollbar relative"
      >
        <div 
          style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIdx = virtualRow.index * bitsPerRow;
            const endIdx = Math.min(startIdx + bitsPerRow, rowCount);
            const rowBits = bitmap.bits.slice(startIdx, endIdx);

            return (
              <div
                key={virtualRow.index}
                className="absolute top-0 left-0 w-full flex gap-1"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="w-8 text-[10px] text-neutral-600 font-mono flex items-center justify-end pr-2 select-none">
                  {startIdx}
                </div>
                {rowBits.map((bit, localIdx) => {
                  const actualRowId = startIdx + localIdx + 1;
                  const isActive = activeRowId === actualRowId;
                  
                  return (
                    <div
                      key={localIdx}
                      onClick={() => onBitClick?.(actualRowId)}
                      title={`Row ID: ${actualRowId} | Bit: ${bit}`}
                      className={`w-4 h-4 flex flex-shrink-0 items-center justify-center text-[9px] rounded-sm font-mono cursor-pointer transition-colors
                        ${bit === 1 
                          ? isActive ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.8)] z-10' : 'bg-blue-500/40 text-blue-200 hover:bg-blue-500/60' 
                          : isActive ? 'bg-neutral-600 text-neutral-300 z-10' : 'bg-neutral-800 text-neutral-600 hover:bg-neutral-700'
                        }
                      `}
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
