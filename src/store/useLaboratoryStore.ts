import { create } from 'zustand';
import { 
  DatasetRow, 
  DatasetBitmapIndex, 
  DatasetSchema, 
  ColumnDefinition,
  generateGenericDataset,
  buildDatasetBitmapIndex
} from '@/lib/bitmap';

// Define some default domains for Epic 1 / Phase 3
const DEFAULT_SCHEMA: DatasetSchema = {
  domain: 'University',
  columns: [
    { name: 'Department', type: 'string', cardinality: 3, distribution: 'Uniform' },
    { name: 'Year', type: 'number', cardinality: 4, distribution: 'Cyclic' },
    { name: 'Hostel', type: 'boolean', cardinality: 2, distribution: 'Random' }
  ]
};

interface LaboratoryState {
  // Configuration
  rowCount: number;
  seed: number;
  schema: DatasetSchema;
  
  // Data
  dataset: DatasetRow[];
  bitmapIndex: DatasetBitmapIndex;
  
  // Actions
  setRowCount: (count: number) => void;
  setSeed: (seed: number) => void;
  updateColumnDef: (colName: string, updates: Partial<ColumnDefinition>) => void;
  generateData: () => void;
}

export const useLaboratoryStore = create<LaboratoryState>((set, get) => ({
  rowCount: 25,
  seed: 42,
  schema: DEFAULT_SCHEMA,
  dataset: [],
  bitmapIndex: {},

  setRowCount: (count) => set({ rowCount: count }),
  setSeed: (seed) => set({ seed }),
  
  updateColumnDef: (colName, updates) => set((state) => ({
    schema: {
      ...state.schema,
      columns: state.schema.columns.map(col => 
        col.name === colName ? { ...col, ...updates } : col
      )
    }
  })),

  generateData: () => {
    const { rowCount, schema, seed } = get();
    // 1. Generate Dataset
    const newDataset = generateGenericDataset(rowCount, schema.columns, seed);
    // 2. Build Bitmap Index for all columns
    const columnsToIndex = schema.columns.map(c => c.name);
    const newIndex = buildDatasetBitmapIndex(newDataset, columnsToIndex);
    
    set({ dataset: newDataset, bitmapIndex: newIndex });
  }
}));
