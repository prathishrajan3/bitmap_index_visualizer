import { Bitmap } from './types';

export interface RleRun {
  bit: number;
  length: number;
}

export interface CompressedBitmap {
  runs: RleRun[];
  originalLength: number;
  compressedSizeBytes: number;
  compressionRatio: number; // original / compressed
}

/**
 * Encodes a raw bitmap array into Run-Length Encoding (RLE).
 */
export function encodeRle(bits: number[]): CompressedBitmap {
  if (bits.length === 0) {
    return { runs: [], originalLength: 0, compressedSizeBytes: 0, compressionRatio: 0 };
  }

  const runs: RleRun[] = [];
  let currentBit = bits[0];
  let currentLength = 1;

  for (let i = 1; i < bits.length; i++) {
    if (bits[i] === currentBit) {
      currentLength++;
    } else {
      runs.push({ bit: currentBit, length: currentLength });
      currentBit = bits[i];
      currentLength = 1;
    }
  }
  runs.push({ bit: currentBit, length: currentLength });

  // Educational estimate of compressed size:
  // Each run needs 1 bit for the value, and approx 31 bits for the length (4 bytes total per run)
  const compressedSizeBytes = runs.length * 4;
  const originalSizeBytes = Math.ceil(bits.length / 8);
  const compressionRatio = compressedSizeBytes === 0 ? 0 : originalSizeBytes / compressedSizeBytes;

  return {
    runs,
    originalLength: bits.length,
    compressedSizeBytes,
    compressionRatio
  };
}

/**
 * Decodes an RLE representation back into a raw bitmap array.
 */
export function decodeRle(compressed: CompressedBitmap): number[] {
  const bits: number[] = [];
  for (const run of compressed.runs) {
    for (let i = 0; i < run.length; i++) {
      bits.push(run.bit);
    }
  }
  return bits;
}
