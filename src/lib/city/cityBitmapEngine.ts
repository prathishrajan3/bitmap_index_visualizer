import { CityEntity, CityBitmapIndex, CityField } from './cityTypes';
import { 
  CityPackedBitmap, 
  createEmptyPackedBitmap, 
  createFullPackedBitmap,
  packedBitmapAnd,
  packedBitmapOr,
  packedBitmapXor,
  packedBitmapNot,
  extractPackedMatchingIds,
  countPackedBits,
  estimatePackedIndexBytes
} from './packedBitmap';

export { 
  CityPackedBitmap, 
  createEmptyPackedBitmap, 
  createFullPackedBitmap,
  packedBitmapAnd,
  packedBitmapOr,
  packedBitmapXor,
  packedBitmapNot,
  extractPackedMatchingIds,
  countPackedBits,
  estimatePackedIndexBytes
};

// Which fields should be indexed
export const INDEXED_CITY_FIELDS: CityField[] = [
  'district',
  'zone',
  'entityType',
  'trafficLevel',
  'roadType',
  'signalStatus',
  'incidentType',
  'emergencyPriority',
  'airQuality',
  'weather',
  'powerStatus',
  'waterStatus',
  'wasteLevel',
  'hospitalLoad',
  'publicTransportStatus',
  'riskLevel',
  'sensorStatus',
  'eventStatus'
];

/**
 * Rebuilds the complete packed bitmap index for the provided city dataset.
 * Uses a single-pass cache-friendly loop setting bits in 32-bit words via Uint32Array.
 * 
 * Each record sets exactly 1 bit in its corresponding categorical value vector.
 */
export function buildCityBitmapIndex(
  dataset: CityEntity[], 
  fieldsToIndex: CityField[] = INDEXED_CITY_FIELDS
): CityBitmapIndex {
  const count = dataset.length;
  const wordCount = (count + 31) >>> 5;
  const index: CityBitmapIndex = {};
  
  for (const field of fieldsToIndex) {
    index[field as string] = {};
  }

  // Single-pass construction over all records
  for (let i = 0; i < count; i++) {
    const row = dataset[i];
    const wordIdx = i >>> 5;
    const bitMask = 1 << (i & 31);

    for (const field of fieldsToIndex) {
      const val = String(row[field]);
      const fieldDict = index[field as string];
      let bmp = fieldDict[val] as CityPackedBitmap;
      if (!bmp) {
        bmp = new CityPackedBitmap(count, new Uint32Array(wordCount), field as string, val);
        fieldDict[val] = bmp;
      }
      bmp.words[wordIdx] |= bitMask;
    }
  }
  
  return index;
}

/**
 * Creates an empty bitmap of the given length (all 0s).
 */
export function createEmptyCityBitmap(length: number): CityPackedBitmap {
  return createEmptyPackedBitmap(length);
}

/**
 * Creates a full bitmap of the given length (all 1s).
 */
export function createFullCityBitmap(length: number): CityPackedBitmap {
  return createFullPackedBitmap(length);
}
