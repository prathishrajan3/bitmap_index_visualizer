import { Bitmap } from './types';

/**
 * Calculates the density of a bitmap vector (number of 1s / total length).
 */
export function calculateDensity(bits: number[]): number {
  if (bits.length === 0) return 0;
  const setBits = bits.filter(b => b === 1).length;
  return setBits / bits.length;
}

/**
 * Calculates the number of set bits (1s) in a bitmap vector.
 */
export function countSetBits(bits: number[]): number {
  return bits.filter(b => b === 1).length;
}

/**
 * Calculates the selectivity of a bitmap (matches / total).
 * In bitmap terms, this is identical to density, but conceptually 
 * selectivity refers to the filtering power of a predicate.
 */
export function calculateSelectivity(bitmap: Bitmap): number {
  return bitmap.density;
}

/**
 * Extracts the 1-indexed row IDs from a bitmap array.
 * Assuming bit index i corresponds to row i+1.
 */
export function bitmapToRowIds(bits: number[]): number[] {
  const rowIds: number[] = [];
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === 1) {
      rowIds.push(i + 1);
    }
  }
  return rowIds;
}

/**
 * Calculates the estimated educational size in bytes of a raw bitmap.
 * Concept: number of bits / 8.
 */
export function calculateRawSizeBytes(bits: number[]): number {
  return Math.ceil(bits.length / 8);
}
