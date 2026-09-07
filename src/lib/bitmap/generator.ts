import { DatasetRow, ColumnDefinition, Distribution } from './types';

// Simple Linear Congruential Generator for deterministic random generation
export class PRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a pseudo-random number between 0 and 1
  public next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Generates an array of distinct values based on cardinality and a domain template.
 */
function generateDistinctValues(column: ColumnDefinition): string[] {
  return Array.from({ length: column.cardinality }, (_, i) => `${column.name}_${i + 1}`);
}

/**
 * Picks a value based on the requested distribution using a PRNG.
 */
function pickValue(distinctValues: string[], distribution: Distribution, index: number, prng: PRNG): string {
  const cardinality = distinctValues.length;
  
  if (distribution === 'Cyclic') {
    return distinctValues[index % cardinality];
  }
  
  if (distribution === 'Uniform') {
    // True uniform random
    const randIndex = Math.floor(prng.next() * cardinality);
    return distinctValues[randIndex];
  }
  
  if (distribution === 'Skewed') {
    // 80% of data goes to the first 20% of values (80/20 rule)
    const threshold = Math.max(1, Math.floor(cardinality * 0.2));
    if (prng.next() < 0.8) {
      return distinctValues[Math.floor(prng.next() * threshold)];
    } else {
      return distinctValues[Math.floor(prng.next() * (cardinality - threshold)) + threshold];
    }
  }

  if (distribution === 'Zipf') {
    // Highly skewed toward rank 1, rank 2, etc. (Approximation)
    // p(rank) is proportional to 1/rank
    let sum = 0;
    for (let i = 1; i <= cardinality; i++) sum += 1 / i;
    let rand = prng.next() * sum;
    for (let i = 1; i <= cardinality; i++) {
      rand -= 1 / i;
      if (rand <= 0) return distinctValues[i - 1];
    }
    return distinctValues[0];
  }

  // Fallback to random
  return distinctValues[Math.floor(prng.next() * cardinality)];
}

/**
 * Generates a full generic dataset based on a schema configuration.
 */
export function generateGenericDataset(
  rowCount: number, 
  columns: ColumnDefinition[], 
  seed: number = 42
): DatasetRow[] {
  const dataset: DatasetRow[] = [];
  const prng = new PRNG(seed);

  // Pre-generate the distinct value domains for each column
  const columnDomains = columns.reduce((acc, col) => {
    acc[col.name] = generateDistinctValues(col);
    return acc;
  }, {} as Record<string, string[]>);

  for (let i = 0; i < rowCount; i++) {
    const row: DatasetRow = { id: i + 1 };
    
    for (const col of columns) {
      row[col.name] = pickValue(columnDomains[col.name], col.distribution, i, prng);
    }
    
    dataset.push(row);
  }

  return dataset;
}
