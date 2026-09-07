import React, { useState } from 'react';
import { Bitmap, encodeRle, CompressedBitmap } from '@/lib/bitmap';
import { BitmapMatrix } from './BitmapMatrix';
import { ArrowRight, FileArchive, Zap } from 'lucide-react';

interface CompressionLabProps {
  availableBitmaps: Bitmap[];
}

export function CompressionLab({ availableBitmaps }: CompressionLabProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (availableBitmaps.length === 0) {
    return <div className="text-sm text-neutral-500">No bitmaps available to compress.</div>;
  }

  const selectedBitmap = availableBitmaps[selectedIndex];
  const compressed = encodeRle(selectedBitmap.bits);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <label className="text-sm text-neutral-400 whitespace-nowrap">Select Bitmap:</label>
        <select 
          value={selectedIndex} 
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          className="flex-1 bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none"
        >
          {availableBitmaps.map((b, i) => (
            <option key={i} value={i}>{b.sourceColumn} = {String(b.sourceValue)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Raw Bitmap Side */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" /> Raw Bitmap
          </h3>
          <BitmapMatrix bitmap={selectedBitmap} />
          
          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Bits</span>
              <span className="font-mono">{compressed.originalLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Estimated Memory Size</span>
              <span className="font-mono">{Math.ceil(compressed.originalLength / 8)} bytes</span>
            </div>
          </div>
        </div>

        {/* Compressed Side */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <FileArchive className="w-4 h-4 text-emerald-400" /> Run-Length Encoded (RLE)
          </h3>
          
          <div className="border border-neutral-800 rounded bg-neutral-900/50 p-4 h-64 overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap gap-2">
              {compressed.runs.map((run, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono
                    ${run.bit === 1 ? 'bg-blue-900/30 border-blue-800/50 text-blue-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}
                  `}
                >
                  <span className="font-bold opacity-50">{run.length}</span> × <span>{run.bit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Runs</span>
              <span className="font-mono text-amber-400">{compressed.runs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Estimated Memory Size</span>
              <span className="font-mono text-emerald-400">{compressed.compressedSizeBytes} bytes</span>
            </div>
            <div className="border-t border-neutral-800 pt-2 mt-2 flex justify-between font-bold">
              <span className="text-neutral-400">Compression Ratio</span>
              <span className="font-mono text-white">
                {compressed.compressionRatio.toFixed(2)}x 
                {compressed.compressionRatio < 1 && <span className="text-red-400 font-normal ml-2 text-xs">(Bloat)</span>}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
