// Core engine for generating datasets and building bitmap indexes

export type Distribution = 'Uniform' | 'Skewed' | 'Random';

export interface DatasetRow {
  id: number;
  value: string;
}

export interface BitmapIndex {
  [key: string]: number[];
}

export interface SimulationState {
  rowCount: number;
  cardinality: number;
  distribution: Distribution;
  dataset: DatasetRow[];
  index: BitmapIndex;
}

// Generate dataset
export function generateDataset(rowCount: number, cardinality: number, distribution: Distribution): DatasetRow[] {
  const dataset: DatasetRow[] = [];
  const distinctValues = Array.from({ length: cardinality }, (_, i) => `Value_${i + 1}`);

  for (let i = 0; i < rowCount; i++) {
    let value = distinctValues[0];
    
    if (distribution === 'Uniform') {
      value = distinctValues[i % cardinality];
    } else if (distribution === 'Random') {
      value = distinctValues[Math.floor(Math.random() * cardinality)];
    } else if (distribution === 'Skewed') {
      // 80% of data belongs to the first 20% of values
      const threshold = Math.max(1, Math.floor(cardinality * 0.2));
      if (Math.random() < 0.8) {
        value = distinctValues[Math.floor(Math.random() * threshold)];
      } else {
        value = distinctValues[Math.floor(Math.random() * (cardinality - threshold)) + threshold];
      }
    }
    
    dataset.push({ id: i + 1, value });
  }

  return dataset;
}

// Build Bitmap Index
export function buildBitmapIndex(dataset: DatasetRow[]): BitmapIndex {
  const index: BitmapIndex = {};
  
  // Find all distinct values
  const values = new Set(dataset.map(row => row.value));
  
  values.forEach(val => {
    index[val] = dataset.map(row => row.value === val ? 1 : 0);
  });
  
  return index;
}

// Perform Boolean Operation (AND/OR)
export function evaluatePredicate(
  op: 'AND' | 'OR', 
  bitmap1: number[], 
  bitmap2: number[]
): number[] {
  if (bitmap1.length !== bitmap2.length) throw new Error("Bitmaps must be same length");
  
  return bitmap1.map((bit, idx) => {
    if (op === 'AND') return bit & bitmap2[idx];
    if (op === 'OR') return bit | bitmap2[idx];
    return 0;
  });
}
