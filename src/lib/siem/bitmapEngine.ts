import { SecurityEvent, SecurityField, SiemBitmapIndex } from './types';
import { buildDatasetBitmapIndex } from '@/lib/bitmap/builder';
import { DatasetRow } from '@/lib/bitmap/types';

export function buildSiemBitmapIndex(events: SecurityEvent[], indexedFields: SecurityField[]): SiemBitmapIndex {
  // Cast SecurityEvent array to DatasetRow array because both are Record<string, any>
  // and the bitmap builder only needs dynamic key access.
  const dataset = events as unknown as DatasetRow[];
  
  // Reuse the existing robust bitmap index builder
  const index = buildDatasetBitmapIndex(dataset, indexedFields as string[]);
  
  return index as SiemBitmapIndex;
}
