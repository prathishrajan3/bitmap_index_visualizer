import { Bitmap } from '@/lib/bitmap/types';

/**
 * 32-bit Population count (Hamming weight).
 * Counts the number of set bits (1s) in a 32-bit unsigned integer.
 */
export function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

/**
 * Returns a bitmask for the final partially occupied word.
 * If length is a multiple of 32, all 32 bits are valid (mask 0xFFFFFFFF).
 * Otherwise, only the lowest (length % 32) bits are valid.
 */
export function getLastWordMask(length: number): number {
  const rem = length & 31;
  return rem === 0 ? 0xFFFFFFFF : ((1 << rem) - 1) >>> 0;
}

/**
 * Count set bits across the entire packed Uint32Array or CityPackedBitmap.
 * Properly masks the final word to ignore bits beyond `length`.
 */
export function countPackedBits(
  input: Uint32Array | CityPackedBitmap, 
  length?: number
): number {
  const words = input instanceof Uint32Array ? input : input.words;
  const len = length !== undefined ? length : (input as CityPackedBitmap).length;
  
  if (len <= 0) return 0;
  const wordCount = (len + 31) >>> 5;
  let count = 0;
  
  for (let i = 0; i < wordCount - 1; i++) {
    const w = words[i];
    if (w !== 0) {
      count += popcount32(w);
    }
  }

  // Handle final word with mask
  const lastMask = getLastWordMask(len);
  const lastWord = words[wordCount - 1] & lastMask;
  if (lastWord !== 0) {
    count += popcount32(lastWord);
  }

  return count;
}

/**
 * Sets a specific bit index to 1.
 */
export function setBit(words: Uint32Array, index: number): void {
  words[index >>> 5] |= (1 << (index & 31));
}

/**
 * Clears a specific bit index to 0.
 */
export function clearBit(words: Uint32Array, index: number): void {
  words[index >>> 5] &= ~(1 << (index & 31));
}

/**
 * Returns 1 if the bit at `index` is set, 0 otherwise.
 */
export function getBit(words: Uint32Array, index: number): number {
  return (words[index >>> 5] >>> (index & 31)) & 1;
}

/**
 * Packed Bitmap Class implementing the standard `Bitmap` interface
 * for 100% backward compatibility with existing visualization components.
 * 
 * Uses Uint32Array where each 32-bit word stores 32 records.
 * Set-bit counts, density, and legacy .bits array are computed lazily on demand,
 * keeping the hot query-execution path 100% allocation-free and blazing fast.
 */
export class CityPackedBitmap implements Bitmap {
  public words: Uint32Array;
  public length: number;
  public sourceColumn: string;
  public sourceValue: string | number | boolean;
  private _setBitCount?: number;
  private _bitsCache?: number[];

  constructor(
    length: number, 
    words?: Uint32Array, 
    sourceColumn: string = 'synthetic', 
    sourceValue: string | number | boolean = 'value'
  ) {
    this.length = length;
    const wordCount = (length + 31) >>> 5;
    this.words = words || new Uint32Array(wordCount);
    this.sourceColumn = sourceColumn;
    this.sourceValue = sourceValue;
  }

  /**
   * Lazily computed set-bit count. Never computed during hot query execution.
   */
  get setBitCount(): number {
    if (this._setBitCount === undefined) {
      this._setBitCount = countPackedBits(this.words, this.length);
    }
    return this._setBitCount;
  }

  /**
   * Lazily computed density.
   */
  get density(): number {
    return this.length > 0 ? this.setBitCount / this.length : 0;
  }

  /**
   * Backward compatibility getter for components (e.g. BitmapQueryVisualizer)
   * that slice/inspect individual bit numbers. Unpacks words only when accessed.
   */
  get bits(): number[] {
    if (!this._bitsCache) {
      const arr = new Array(this.length);
      const wordCount = (this.length + 31) >>> 5;
      for (let w = 0; w < wordCount; w++) {
        const word = this.words[w];
        const base = w << 5;
        const limit = Math.min(32, this.length - base);
        for (let b = 0; b < limit; b++) {
          arr[base + b] = (word >>> b) & 1;
        }
      }
      this._bitsCache = arr;
    }
    return this._bitsCache;
  }

  clone(): CityPackedBitmap {
    const copyWords = new Uint32Array(this.words);
    return new CityPackedBitmap(this.length, copyWords, this.sourceColumn, this.sourceValue);
  }
}

/**
 * Creates an empty packed bitmap of the given length (all 0s).
 */
export function createPackedBitmap(
  length: number, 
  words?: Uint32Array, 
  sourceColumn?: string, 
  sourceValue?: string
): CityPackedBitmap {
  return new CityPackedBitmap(length, words, sourceColumn, sourceValue);
}

/**
 * Creates an empty bitmap of the given length.
 */
export function createEmptyPackedBitmap(length: number): CityPackedBitmap {
  return new CityPackedBitmap(length, undefined, 'synthetic', 'empty');
}

/**
 * Creates a full bitmap of the given length (all valid bits set to 1).
 */
export function createFullPackedBitmap(length: number): CityPackedBitmap {
  const wordCount = (length + 31) >>> 5;
  const words = new Uint32Array(wordCount);
  words.fill(0xFFFFFFFF);
  
  // Mask the final word so trailing bits beyond length are 0
  if (wordCount > 0) {
    words[wordCount - 1] &= getLastWordMask(length);
  }
  
  return new CityPackedBitmap(length, words, 'synthetic', 'full');
}

/**
 * Bitwise AND between two packed bitmaps.
 * Operates on 32 records per word.
 */
export function packedBitmapAnd(
  a: CityPackedBitmap, 
  b: CityPackedBitmap, 
  dest?: CityPackedBitmap
): CityPackedBitmap {
  const length = a.length;
  const wordCount = (length + 31) >>> 5;
  const target = dest || new CityPackedBitmap(length, new Uint32Array(wordCount));
  const aWords = a.words;
  const bWords = b.words;
  const outWords = target.words;

  for (let i = 0; i < wordCount; i++) {
    outWords[i] = aWords[i] & bWords[i];
  }

  return target;
}

/**
 * Bitwise OR between two packed bitmaps.
 * Operates on 32 records per word.
 */
export function packedBitmapOr(
  a: CityPackedBitmap, 
  b: CityPackedBitmap, 
  dest?: CityPackedBitmap
): CityPackedBitmap {
  const length = a.length;
  const wordCount = (length + 31) >>> 5;
  const target = dest || new CityPackedBitmap(length, new Uint32Array(wordCount));
  const aWords = a.words;
  const bWords = b.words;
  const outWords = target.words;

  for (let i = 0; i < wordCount; i++) {
    outWords[i] = aWords[i] | bWords[i];
  }

  return target;
}

/**
 * Bitwise XOR between two packed bitmaps.
 * Operates on 32 records per word.
 */
export function packedBitmapXor(
  a: CityPackedBitmap, 
  b: CityPackedBitmap, 
  dest?: CityPackedBitmap
): CityPackedBitmap {
  const length = a.length;
  const wordCount = (length + 31) >>> 5;
  const target = dest || new CityPackedBitmap(length, new Uint32Array(wordCount));
  const aWords = a.words;
  const bWords = b.words;
  const outWords = target.words;

  for (let i = 0; i < wordCount; i++) {
    outWords[i] = aWords[i] ^ bWords[i];
  }

  return target;
}

/**
 * Bitwise NOT on a packed bitmap.
 * Inverts all bits and masks the final word so trailing bits remain 0.
 */
export function packedBitmapNot(
  a: CityPackedBitmap, 
  dest?: CityPackedBitmap
): CityPackedBitmap {
  const length = a.length;
  const wordCount = (length + 31) >>> 5;
  const target = dest || new CityPackedBitmap(length, new Uint32Array(wordCount));
  const aWords = a.words;
  const outWords = target.words;
  const lastMask = getLastWordMask(length);

  for (let i = 0; i < wordCount; i++) {
    outWords[i] = ~aWords[i];
  }
  
  if (wordCount > 0) {
    outWords[wordCount - 1] &= lastMask;
  }

  return target;
}

/**
 * Extracts matching record IDs from a packed bitmap vector.
 * 
 * Uses fast word-level skipping (if word === 0, skips 32 records in one CPU comparison).
 * For non-zero words, repeatedly isolates the lowest set bit using `word & -word`
 * and clears it with `word & (word - 1)`.
 * 
 * Generates matching IDs in strictly ascending order, matching Table Scan order.
 */
export function extractPackedMatchingIds(
  wordsOrBitmap: Uint32Array | CityPackedBitmap, 
  lengthOrDatasetIds: number | string[], 
  datasetIds?: string[]
): string[] {
  let words: Uint32Array;
  let length: number;
  let ids: string[];

  if (wordsOrBitmap instanceof Uint32Array) {
    words = wordsOrBitmap;
    length = lengthOrDatasetIds as number;
    ids = datasetIds || [];
  } else {
    words = wordsOrBitmap.words;
    length = wordsOrBitmap.length;
    ids = lengthOrDatasetIds as string[];
  }

  const matchingIds: string[] = [];
  const wordCount = (length + 31) >>> 5;
  const lastWordIdx = wordCount - 1;
  const lastMask = getLastWordMask(length);

  for (let w = 0; w < wordCount; w++) {
    let word = words[w];
    if (w === lastWordIdx) {
      word &= lastMask;
    }
    if (word === 0) continue; // Fast skip 32 non-matching records!

    const baseIdx = w << 5;
    while (word !== 0) {
      const lsb = word & -word;
      const bitPos = 31 - Math.clz32(lsb);
      const recordIdx = baseIdx + bitPos;
      if (recordIdx < length) {
        matchingIds.push(ids[recordIdx]);
      }
      word &= word - 1; // Clear lowest set bit
    }
  }

  return matchingIds;
}

/**
 * Estimates index memory consumption in bytes.
 */
export function estimatePackedIndexBytes(
  index: Record<string, Record<string, any>>, 
  datasetSize?: number
): number {
  let size = datasetSize || 0;
  let totalVectors = 0;
  
  for (const field of Object.keys(index)) {
    const fieldMap = index[field] || {};
    const keys = Object.keys(fieldMap);
    totalVectors += keys.length;
    if (size === 0 && keys.length > 0) {
      size = fieldMap[keys[0]].length;
    }
  }
  
  const wordCount = (size + 31) >>> 5;
  const bytesPerVector = wordCount * 4;
  return totalVectors * bytesPerVector;
}
