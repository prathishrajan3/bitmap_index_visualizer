export type Distribution = 'Uniform' | 'Cyclic' | 'Random' | 'Skewed' | 'Zipf';

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  cardinality: number;
  distribution: Distribution;
}

export interface DatasetSchema {
  domain: string;
  columns: ColumnDefinition[];
}

export interface DatasetRow {
  id: number;
  [columnName: string]: string | number | boolean;
}

// A single bitmap vector representing one distinct value of one column
export interface Bitmap {
  bits: number[];
  length: number;
  setBitCount: number;
  density: number; // 0.0 to 1.0
  sourceColumn: string;
  sourceValue: string | number | boolean;
}

// The complete bitmap index for a specific column
// Maps a stringified distinct value to its Bitmap object
export interface ColumnBitmapIndex {
  [distinctValue: string]: Bitmap;
}

// The complete index for the entire dataset
export interface DatasetBitmapIndex {
  [columnName: string]: ColumnBitmapIndex;
}

export interface Predicate {
  column: string;
  operator: '=' | '!=' | 'IN' | 'IS NULL' | 'IS NOT NULL';
  value: any;
}

export type BooleanOperator = 'AND' | 'OR' | 'NOT' | 'XOR';

export interface BooleanExpression {
  operator: BooleanOperator;
  left: Predicate | BooleanExpression | Bitmap;
  right?: Predicate | BooleanExpression | Bitmap; // Optional for NOT
}
