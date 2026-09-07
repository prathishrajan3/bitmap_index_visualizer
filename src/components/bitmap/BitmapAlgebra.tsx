import React, { useState } from 'react';
import { Bitmap, bitmapAnd, bitmapOr, bitmapXor, createBitmapResult } from '@/lib/bitmap';
import { BitmapMatrix } from './BitmapMatrix';
import { Play, Calculator } from 'lucide-react';

interface BitmapAlgebraProps {
  availableBitmaps: Bitmap[];
}

export function BitmapAlgebra({ availableBitmaps }: BitmapAlgebraProps) {
  const [leftIndex, setLeftIndex] = useState<number>(0);
  const [rightIndex, setRightIndex] = useState<number>(1);
  const [operator, setOperator] = useState<'AND' | 'OR' | 'XOR'>('AND');
  const [result, setResult] = useState<Bitmap | null>(null);

  const handleCalculate = () => {
    if (availableBitmaps.length < 2) return;
    
    const left = availableBitmaps[leftIndex];
    const right = availableBitmaps[rightIndex];
    
    let resultBits: number[];
    if (operator === 'AND') resultBits = bitmapAnd(left.bits, right.bits);
    else if (operator === 'OR') resultBits = bitmapOr(left.bits, right.bits);
    else resultBits = bitmapXor(left.bits, right.bits);
    
    setResult(createBitmapResult(
      resultBits,
      `Derived (${left.sourceColumn} ${operator} ${right.sourceColumn})`,
      `${left.sourceValue} ${operator} ${right.sourceValue}`
    ));
  };

  if (availableBitmaps.length < 2) {
    return <div className="text-sm text-neutral-500 p-4 border border-neutral-800 rounded">Generate a dataset with at least 2 distinct values to use the algebra playground.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-4 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Operand A</label>
          <select 
            value={leftIndex} 
            onChange={(e) => setLeftIndex(Number(e.target.value))}
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none"
          >
            {availableBitmaps.map((b, i) => (
              <option key={i} value={i}>{b.sourceColumn} = {String(b.sourceValue)}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-neutral-500 mb-1 text-center">Operator</label>
          <select 
            value={operator} 
            onChange={(e) => setOperator(e.target.value as any)}
            className="w-24 bg-blue-900/20 text-blue-400 border border-blue-800 rounded p-2 text-sm outline-none font-bold text-center"
          >
            <option>AND</option>
            <option>OR</option>
            <option>XOR</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Operand B</label>
          <select 
            value={rightIndex} 
            onChange={(e) => setRightIndex(Number(e.target.value))}
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none"
          >
            {availableBitmaps.map((b, i) => (
              <option key={i} value={i}>{b.sourceColumn} = {String(b.sourceValue)}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleCalculate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded flex items-center justify-center h-10 w-12 transition-colors"
          title="Calculate"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="opacity-75"><BitmapMatrix bitmap={availableBitmaps[leftIndex]} /></div>
          <div className="opacity-75"><BitmapMatrix bitmap={availableBitmaps[rightIndex]} /></div>
          <div className="ring-2 ring-emerald-500 rounded"><BitmapMatrix bitmap={result} /></div>
        </div>
      )}
    </div>
  );
}
