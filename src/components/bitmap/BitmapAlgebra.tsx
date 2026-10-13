"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bitmap, createBitmapResult } from '@/lib/bitmap';
import { BitmapMatrix } from './BitmapMatrix';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';

interface BitmapAlgebraProps {
  availableBitmaps: Bitmap[];
}

export function BitmapAlgebra({ availableBitmaps }: BitmapAlgebraProps) {
  const [leftIndex, setLeftIndex] = useState<number>(0);
  const [rightIndex, setRightIndex] = useState<number>(1);
  const [operator, setOperator] = useState<'AND' | 'OR' | 'XOR'>('AND');
  const lastOpSignatureRef = useRef<string>('');

  const validBitmaps = useMemo(() => {
    return Array.isArray(availableBitmaps) 
      ? availableBitmaps.filter(b => b && Array.isArray(b.bits)) 
      : [];
  }, [availableBitmaps]);

  // Clamp indices within bounds
  const safeLeftIndex = Math.min(Math.max(0, leftIndex), Math.max(0, validBitmaps.length - 1));
  const safeRightIndex = Math.min(Math.max(0, rightIndex), Math.max(0, validBitmaps.length - 1));

  const left = validBitmaps[safeLeftIndex];
  const right = validBitmaps[safeRightIndex];

  // Pure derived computation via useMemo (avoids setState inside useEffect loop)
  const computation = useMemo(() => {
    if (!left || !right || !Array.isArray(left.bits) || !Array.isArray(right.bits)) {
      return null;
    }
    const len = Math.min(left.bits.length, right.bits.length);
    if (len === 0) return null;

    const leftSlice = left.bits.slice(0, len);
    const rightSlice = right.bits.slice(0, len);

    let resultBits: number[];
    if (operator === 'AND') {
      resultBits = leftSlice.map((b, i) => b & rightSlice[i]);
    } else if (operator === 'OR') {
      resultBits = leftSlice.map((b, i) => b | rightSlice[i]);
    } else {
      resultBits = leftSlice.map((b, i) => b ^ rightSlice[i]);
    }

    const matchCount = resultBits.filter(b => b === 1).length;
    const derivedResult = createBitmapResult(
      resultBits,
      `Derived (${left.sourceColumn} ${operator} ${right.sourceColumn})`,
      `${left.sourceValue} ${operator} ${right.sourceValue}`
    );

    return {
      resultBits,
      matchCount,
      derivedResult
    };
  }, [left, right, operator]);

  // Synchronize with store only when meaningful operands/operator change
  useEffect(() => {
    if (!computation || !left || !right) return;
    const opSignature = `${left.sourceColumn}:${left.sourceValue}:${operator}:${right.sourceColumn}:${right.sourceValue}`;

    if (lastOpSignatureRef.current !== opSignature) {
      lastOpSignatureRef.current = opSignature;
      // Use getState() directly to prevent component from subscribing to store updates
      useLaboratoryStore.getState().setAlgebraRecord({
        operandA: `${left.sourceColumn} = '${left.sourceValue}'`,
        operator,
        operandB: `${right.sourceColumn} = '${right.sourceValue}'`,
        resultBits: computation.resultBits,
        matchCount: computation.matchCount
      });
    }
  }, [computation, left, right, operator]);

  if (validBitmaps.length < 2) {
    return (
      <div className="text-sm text-neutral-500 p-4 border border-neutral-800 rounded bg-neutral-900/30">
        Generate a dataset with at least 2 distinct values to use the algebra playground.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-4 bg-neutral-900/50 p-4 rounded border border-neutral-800">
        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Operand A</label>
          <select 
            value={safeLeftIndex} 
            onChange={(e) => setLeftIndex(Number(e.target.value))}
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none"
          >
            {validBitmaps.map((b, i) => (
              <option key={i} value={i}>{b.sourceColumn} = {String(b.sourceValue)}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-neutral-500 mb-1 text-center">Operator</label>
          <select 
            value={operator} 
            onChange={(e) => setOperator(e.target.value as 'AND' | 'OR' | 'XOR')}
            className="w-24 bg-blue-900/20 text-blue-400 border border-blue-800 rounded p-2 text-sm outline-none font-bold text-center"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
            <option value="XOR">XOR</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-neutral-500 mb-1">Operand B</label>
          <select 
            value={safeRightIndex} 
            onChange={(e) => setRightIndex(Number(e.target.value))}
            className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-sm outline-none"
          >
            {validBitmaps.map((b, i) => (
              <option key={i} value={i}>{b.sourceColumn} = {String(b.sourceValue)}</option>
            ))}
          </select>
        </div>
      </div>

      {computation?.derivedResult && left && right && (
        <div className="flex flex-col gap-4">
          <div className="opacity-75"><BitmapMatrix bitmap={left} /></div>
          <div className="flex justify-center text-blue-400 font-bold text-lg">{operator}</div>
          <div className="opacity-75"><BitmapMatrix bitmap={right} /></div>
          <div className="flex justify-center text-emerald-400 font-bold text-lg">=</div>
          <div className="ring-2 ring-emerald-500 rounded"><BitmapMatrix bitmap={computation.derivedResult} /></div>
        </div>
      )}
    </div>
  );
}
