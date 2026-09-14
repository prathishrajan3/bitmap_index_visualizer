import { CityEntity, CityBitmapIndex, CityField } from './cityTypes';
import { Bitmap } from '@/lib/bitmap/types';
import { buildDatasetBitmapIndex } from '@/lib/bitmap/builder';
import { countSetBits, calculateDensity } from '@/lib/bitmap/statistics';

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
 * Rebuilds the complete bitmap index for the provided city dataset.
 * Re-uses the existing generic buildDatasetBitmapIndex.
 */
export function buildCityBitmapIndex(dataset: CityEntity[]): CityBitmapIndex {
  const index: CityBitmapIndex = {};
  
  for (const field of INDEXED_CITY_FIELDS) {
    // The existing builder maps each distinct value to a Bitmap array
    const fieldIndex = buildDatasetBitmapIndex(dataset as any, [field as string]);
    index[field as string] = fieldIndex[field as string] as Record<string, Bitmap>;
  }
  
  return index;
}

/**
 * Creates an empty bitmap of the given length (all 0s).
 */
export function createEmptyCityBitmap(length: number): Bitmap {
  return {
    bits: new Array(length).fill(0),
    length,
    setBitCount: 0,
    density: 0,
    sourceColumn: 'synthetic',
    sourceValue: 'empty'
  };
}

/**
 * Creates a full bitmap of the given length (all 1s).
 */
export function createFullCityBitmap(length: number): Bitmap {
  return {
    bits: new Array(length).fill(1),
    length,
    setBitCount: length,
    density: 1,
    sourceColumn: 'synthetic',
    sourceValue: 'full'
  };
}
