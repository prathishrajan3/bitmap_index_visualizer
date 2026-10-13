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
    { id: 'col-1', name: 'Department', type: 'string', cardinality: 3, distribution: 'Uniform' },
    { id: 'col-2', name: 'Year', type: 'number', cardinality: 4, distribution: 'Cyclic' },
    { id: 'col-3', name: 'Hostel', type: 'boolean', cardinality: 2, distribution: 'Random' }
  ]
};

export interface QueryRecord {
  sql: string;
  executionMsg?: string;
  results?: any[];
}

export interface AlgebraRecord {
  operandA: string;
  operator: 'AND' | 'OR' | 'XOR';
  operandB: string;
  resultBits: number[];
  matchCount: number;
}

export interface QuizRecord {
  score: number;
  total: number;
  percentage: number;
  difficulty: string;
  completedAt: string;
}

interface LaboratoryState {
  // Configuration
  rowCount: number;
  seed: number;
  schema: DatasetSchema;
  
  // Data
  dataset: DatasetRow[];
  bitmapIndex: DatasetBitmapIndex;
  
  // Activity History for Reports
  queryRecord: QueryRecord | null;
  algebraRecord: AlgebraRecord | null;
  quizRecord: QuizRecord | null;
  
  // Actions
  setRowCount: (count: number) => void;
  setSeed: (seed: number) => void;
  updateColumnDef: (colIdOrName: string, updates: Partial<ColumnDefinition>) => void;
  addColumnDef: () => void;
  removeColumnDef: (colIdOrName: string) => void;
  generateData: () => void;
  loadExternalDataset: (dataset: DatasetRow[], columns?: ColumnDefinition[], domain?: string) => void;
  buildIndexes: (columns: string[]) => void;
  setQueryRecord: (record: QueryRecord | null) => void;
  setAlgebraRecord: (record: AlgebraRecord | null) => void;
  setQuizRecord: (record: QuizRecord | null) => void;
}

export const useLaboratoryStore = create<LaboratoryState>((set, get) => ({
  rowCount: 25,
  seed: 42,
  schema: DEFAULT_SCHEMA,
  dataset: [],
  bitmapIndex: {},
  
  queryRecord: null,
  algebraRecord: null,
  quizRecord: null,

  setQueryRecord: (record) => set({ queryRecord: record }),
  setAlgebraRecord: (record) => set({ algebraRecord: record }),
  setQuizRecord: (record) => set({ quizRecord: record }),

  setRowCount: (count) => set({ rowCount: count }),
  setSeed: (seed) => set({ seed }),
  
  updateColumnDef: (colIdOrName, updates) => set((state) => {
    let oldName = '';
    const newColumns = state.schema.columns.map(col => {
      if (col.id === colIdOrName || col.name === colIdOrName) {
        oldName = col.name;
        return { ...col, ...updates };
      }
      return col;
    });

    const newName = updates.name;
    let newDataset = state.dataset;
    // If column was renamed and dataset has rows, rename property in all rows
    if (newName && oldName && newName !== oldName && state.dataset.length > 0) {
      newDataset = state.dataset.map(row => {
        const newRow = { ...row };
        if (oldName in newRow) {
          newRow[newName] = newRow[oldName];
          delete newRow[oldName];
        }
        return newRow;
      });
    }

    return {
      schema: {
        ...state.schema,
        columns: newColumns
      },
      dataset: newDataset
    };
  }),

  addColumnDef: () => set((state) => {
    const newId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let count = state.schema.columns.length + 1;
    let newName = `Column ${count}`;
    while (state.schema.columns.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
      count++;
      newName = `Column ${count}`;
    }
    const newCol: ColumnDefinition = {
      id: newId,
      name: newName,
      type: 'string',
      cardinality: 3,
      distribution: 'Uniform'
    };

    // If dataset already exists, add the new column to existing rows with realistic options
    const sampleOptions = [`${newName}_A`, `${newName}_B`, `${newName}_C`];
    const newDataset = state.dataset.length > 0
      ? state.dataset.map((row, idx) => ({
          ...row,
          [newName]: sampleOptions[idx % sampleOptions.length]
        }))
      : [];

    return {
      schema: {
        ...state.schema,
        columns: [...state.schema.columns, newCol]
      },
      dataset: newDataset
    };
  }),

  removeColumnDef: (colIdOrName) => set((state) => {
    const targetCol = state.schema.columns.find(c => c.id === colIdOrName || c.name === colIdOrName);
    const colName = targetCol ? targetCol.name : colIdOrName;
    const remainingCols = state.schema.columns.filter(c => c.id !== colIdOrName && c.name !== colIdOrName);
    
    const newDataset = state.dataset.map(row => {
      const newRow = { ...row };
      delete newRow[colName];
      return newRow;
    });

    return {
      schema: {
        ...state.schema,
        columns: remainingCols
      },
      dataset: newDataset
    };
  }),

  generateData: () => {
    const { rowCount, schema, seed } = get();
    // 1. Generate Dataset
    const newDataset = generateGenericDataset(rowCount, schema.columns, seed);
    // Do NOT build index yet.
    set({ dataset: newDataset, bitmapIndex: {} });
  },

  loadExternalDataset: (newDataset: DatasetRow[], newColumns?: ColumnDefinition[], newDomain?: string) => {
    if (!newDataset || newDataset.length === 0) return;
    const sample = newDataset[0];
    const columns: ColumnDefinition[] = newColumns && newColumns.length > 0
      ? newColumns.map((c, i) => ({
          id: c.id || `col-${Date.now()}-${i}-${c.name}`,
          name: c.name,
          type: c.type || 'string',
          cardinality: c.cardinality || (new Set(newDataset.map(r => r[c.name])).size),
          distribution: c.distribution || 'Uniform'
        }))
      : Object.keys(sample).filter(k => k !== 'id').map((name, i) => {
          const distinctVals = new Set(newDataset.map(r => r[name]));
          return {
            id: `col-${Date.now()}-${i}-${name}`,
            name,
            type: 'string',
            cardinality: distinctVals.size,
            distribution: 'Uniform'
          };
        });

    set(state => ({
      dataset: newDataset,
      bitmapIndex: {},
      rowCount: newDataset.length,
      schema: {
        ...state.schema,
        domain: newDomain || state.schema.domain,
        columns
      }
    }));
  },

  buildIndexes: (columnsToIndex: string[]) => {
    const { dataset } = get();
    if (dataset.length === 0) return;
    const newIndex = buildDatasetBitmapIndex(dataset, columnsToIndex);
    set({ bitmapIndex: newIndex });
  }
}));
