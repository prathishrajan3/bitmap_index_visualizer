import { Bitmap } from './types';
import { calculateDensity, countSetBits } from './statistics';

/**
 * Performs a bitwise AND on two bitmap arrays of equal length.
 */
export function bitmapAnd(bitsA: number[], bitsB: number[]): number[] {
  if (bitsA.length !== bitsB.length) throw new Error("Bitmaps must be same length for AND");
  return bitsA.map((bit, idx) => bit & bitsB[idx]);
}

/**
 * Performs a bitwise OR on two bitmap arrays of equal length.
 */
export function bitmapOr(bitsA: number[], bitsB: number[]): number[] {
  if (bitsA.length !== bitsB.length) throw new Error("Bitmaps must be same length for OR");
  return bitsA.map((bit, idx) => bit | bitsB[idx]);
}

/**
 * Performs a bitwise XOR on two bitmap arrays of equal length.
 */
export function bitmapXor(bitsA: number[], bitsB: number[]): number[] {
  if (bitsA.length !== bitsB.length) throw new Error("Bitmaps must be same length for XOR");
  return bitsA.map((bit, idx) => bit ^ bitsB[idx]);
}

/**
 * Performs a bitwise NOT on a bitmap array.
 */
export function bitmapNot(bitsA: number[]): number[] {
  return bitsA.map(bit => (bit === 1 ? 0 : 1));
}

/**
 * Helper to wrap raw array results into the full Bitmap abstraction.
 */
export function createBitmapResult(
  bits: number[], 
  sourceColumn: string = "Derived", 
  sourceValue: string = "Expression"
): Bitmap {
  return {
    bits,
    length: bits.length,
    setBitCount: countSetBits(bits),
    density: calculateDensity(bits),
    sourceColumn,
    sourceValue
  };
}
