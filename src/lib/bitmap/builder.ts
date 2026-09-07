import { DatasetRow, DatasetBitmapIndex, ColumnBitmapIndex, Bitmap } from './types';
import { calculateDensity, countSetBits } from './statistics';

/**
 * Builds a complete bitmap index for a single column.
 */
export function buildColumnBitmapIndex(dataset: DatasetRow[], columnName: string): ColumnBitmapIndex {
  const index: ColumnBitmapIndex = {};
  
  // Find all distinct values for this column
  const values = new Set(dataset.map(row => String(row[columnName])));
  
  values.forEach(val => {
    // Generate the bits vector
    const bits = dataset.map(row => String(row[columnName]) === val ? 1 : 0);
    
    // Construct the Bitmap object
    const bitmap: Bitmap = {
      bits,
      length: bits.length,
      setBitCount: countSetBits(bits),
      density: calculateDensity(bits),
      sourceColumn: columnName,
      sourceValue: val
    };
    
    index[val] = bitmap;
  });
  
  return index;
}

/**
 * Builds the complete multi-column dataset bitmap index.
 */
export function buildDatasetBitmapIndex(dataset: DatasetRow[], indexedColumns: string[]): DatasetBitmapIndex {
  const fullIndex: DatasetBitmapIndex = {};
  
  for (const col of indexedColumns) {
    fullIndex[col] = buildColumnBitmapIndex(dataset, col);
  }
  
  return fullIndex;
}
