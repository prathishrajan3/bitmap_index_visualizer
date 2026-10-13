import { create } from 'zustand';
import { 
  DatasetRow, 
  DatasetBitmapIndex, 
  DatasetSchema, 
  ColumnDefinition,
  generateGenericDataset,
  buildDatasetBitmapIndex
} from '@/lib/bitmap';

// Define some default domains
const DEFAULT_SCHEMA: DatasetSchema = {
  domain: 'University',
  columns: [
    { id: 'col-1', name: 'Department', type: 'string', cardinality: 3, distribution: 'Uniform' },
    { id: 'col-2', name: 'Year', type: 'number', cardinality: 4, distribution: 'Cyclic' },
    { id: 'col-3', name: 'Hostel', type: 'boolean', cardinality: 2, distribution: 'Random' }
  ]
};

export interface ActivityLogEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'success' | 'failure' | 'info';
  details?: string;
}

export interface DatasetHistoryItem {
  timestamp: string;
  source: 'synthetic' | 'csv' | 'ai';
  rowCount: number;
  columnCount: number;
  seed?: number;
  domain?: string;
}

export interface QueryRecord {
  id?: string;
  sql: string;
  timestamp?: string;
  executionMsg?: string;
  results?: any[];
  rowCount?: number;
  returnedRows?: number;
  executionTimeMs?: number;
  status?: 'success' | 'failure';
  error?: string;
}

export interface AlgebraRecord {
  id?: string;
  operandA: string;
  operator: 'AND' | 'OR' | 'XOR';
  operandB: string;
  resultBits: number[];
  matchCount: number;
  totalRows?: number;
  selectivityPct?: number;
  timestamp?: string;
}

export interface QuizRecord {
  id?: string;
  score: number;
  total: number;
  percentage: number;
  difficulty: string;
  completedAt: string;
  source?: 'pyq' | 'ai';
  correctCount?: number;
  incorrectCount?: number;
  status?: 'completed' | 'in_progress';
}

export interface IndexBuildStats {
  timestamp: string;
  buildDurationMs: number;
  indexedColumns: string[];
  vectorCount: number;
  distinctValuesCount: number;
  totalBits: number;
  setBits: number;
  densityPct: number;
}

export interface ActivityCounts {
  datasetGenerations: number;
  indexBuilds: number;
  algebraOperations: number;
  sqlAttempts: number;
  sqlSuccesses: number;
  sqlFailures: number;
  quizCompleted: number;
}

export interface LaboratoryState {
  // Session & Metadata
  sessionStartedAt: string;
  datasetSource: 'synthetic' | 'csv' | 'ai';

  // Configuration
  rowCount: number;
  seed: number;
  schema: DatasetSchema;
  
  // Data
  dataset: DatasetRow[];
  bitmapIndex: DatasetBitmapIndex;
  
  // Activity History & Records for Reports
  queryRecord: QueryRecord | null;
  algebraRecord: AlgebraRecord | null;
  quizRecord: QuizRecord | null;

  datasetHistory: DatasetHistoryItem[];
  activityLog: ActivityLogEvent[];
  activityCounts: ActivityCounts;
  algebraHistory: AlgebraRecord[];
  queryHistory: QueryRecord[];
  quizHistory: QuizRecord[];
  lastIndexBuildStats: IndexBuildStats | null;
  
  // Actions
  setRowCount: (count: number) => void;
  setSeed: (seed: number) => void;
  updateColumnDef: (colIdOrName: string, updates: Partial<ColumnDefinition>) => void;
  addColumnDef: () => void;
  removeColumnDef: (colIdOrName: string) => void;
  generateData: () => void;
  loadExternalDataset: (dataset: DatasetRow[], columns?: ColumnDefinition[], domain?: string, source?: 'csv' | 'ai') => void;
  buildIndexes: (columns: string[]) => void;
  setQueryRecord: (record: QueryRecord | null) => void;
  setAlgebraRecord: (record: AlgebraRecord | null) => void;
  setQuizRecord: (record: QuizRecord | null) => void;
  
  // Extended Activity Actions
  logActivity: (type: string, description: string, status?: 'success' | 'failure' | 'info', details?: string) => void;
  recordQueryAttempt: (record: QueryRecord) => void;
  recordAlgebraOperation: (record: AlgebraRecord) => void;
  recordQuizAttempt: (record: QuizRecord) => void;
  setDatasetSource: (source: 'synthetic' | 'csv' | 'ai') => void;
}

export const useLaboratoryStore = create<LaboratoryState>((set, get) => {
  const initialSessionStart = new Date().toISOString();

  return {
    sessionStartedAt: initialSessionStart,
    datasetSource: 'synthetic',
    rowCount: 25,
    seed: 42,
    schema: DEFAULT_SCHEMA,
    dataset: [],
    bitmapIndex: {},
    
    queryRecord: null,
    algebraRecord: null,
    quizRecord: null,

    datasetHistory: [],
    activityLog: [],
    activityCounts: {
      datasetGenerations: 0,
      indexBuilds: 0,
      algebraOperations: 0,
      sqlAttempts: 0,
      sqlSuccesses: 0,
      sqlFailures: 0,
      quizCompleted: 0
    },
    algebraHistory: [],
    queryHistory: [],
    quizHistory: [],
    lastIndexBuildStats: null,

    logActivity: (type, description, status = 'info', details) => set((state) => {
      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type,
        description,
        status,
        details
      };
      // Keep up to 200 events
      return {
        activityLog: [event, ...state.activityLog].slice(0, 200)
      };
    }),

    setDatasetSource: (source) => set({ datasetSource: source }),

    setQueryRecord: (record) => {
      if (!record) {
        set({ queryRecord: null });
        return;
      }
      get().recordQueryAttempt(record);
    },

    recordQueryAttempt: (record) => set((state) => {
      const isSuccess = record.status === 'success' || (!record.error && (!record.executionMsg || !record.executionMsg.startsWith('Error:')));
      const status: 'success' | 'failure' = isSuccess ? 'success' : 'failure';

      const enriched: QueryRecord = {
        ...record,
        id: record.id || `qry-${Date.now()}`,
        timestamp: record.timestamp || new Date().toISOString(),
        status
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'sql_query',
        description: `Executed query: ${record.sql.slice(0, 50)}${record.sql.length > 50 ? '...' : ''}`,
        status,
        details: record.error || record.executionMsg
      };

      return {
        queryRecord: enriched,
        queryHistory: [enriched, ...state.queryHistory].slice(0, 100),
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          sqlAttempts: state.activityCounts.sqlAttempts + 1,
          sqlSuccesses: state.activityCounts.sqlSuccesses + (status === 'success' ? 1 : 0),
          sqlFailures: state.activityCounts.sqlFailures + (status === 'failure' ? 1 : 0)
        }
      };
    }),

    setAlgebraRecord: (record) => {
      if (!record) {
        set({ algebraRecord: null });
        return;
      }
      get().recordAlgebraOperation(record);
    },

    recordAlgebraOperation: (record) => set((state) => {
      const enriched: AlgebraRecord = {
        ...record,
        id: record.id || `alg-${Date.now()}`,
        timestamp: record.timestamp || new Date().toISOString(),
        totalRows: record.totalRows || state.dataset.length,
        selectivityPct: record.selectivityPct !== undefined 
          ? record.selectivityPct 
          : (state.dataset.length > 0 ? Math.round((record.matchCount / state.dataset.length) * 100) : 0)
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'algebra_calc',
        description: `Boolean algebra: (${record.operandA}) ${record.operator} (${record.operandB}) = ${record.matchCount} rows`,
        status: 'success'
      };

      return {
        algebraRecord: enriched,
        algebraHistory: [enriched, ...state.algebraHistory].slice(0, 100),
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          algebraOperations: state.activityCounts.algebraOperations + 1
        }
      };
    }),

    setQuizRecord: (record) => {
      if (!record) {
        set({ quizRecord: null });
        return;
      }
      get().recordQuizAttempt(record);
    },

    recordQuizAttempt: (record) => set((state) => {
      const isComplete = record.status === 'completed' || record.status === undefined;

      const enriched: QuizRecord = {
        ...record,
        id: record.id || `quiz-${Date.now()}`,
        status: isComplete ? 'completed' : 'in_progress'
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: isComplete ? 'quiz_complete' : 'quiz_progress',
        description: isComplete 
          ? `Completed Quiz: ${record.score}/${record.total} (${record.percentage}%) - ${record.difficulty}` 
          : `Quiz in progress: Question answered`,
        status: 'info'
      };

      return {
        quizRecord: enriched,
        quizHistory: isComplete ? [enriched, ...state.quizHistory].slice(0, 50) : state.quizHistory,
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          quizCompleted: state.activityCounts.quizCompleted + (isComplete ? 1 : 0)
        }
      };
    }),

    setRowCount: (count) => set((state) => {
      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'config_change',
        description: `Changed row count to ${count}`,
        status: 'info'
      };
      return {
        rowCount: count,
        activityLog: [event, ...state.activityLog].slice(0, 200)
      };
    }),

    setSeed: (seed) => set((state) => {
      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'config_change',
        description: `Changed random seed to ${seed}`,
        status: 'info'
      };
      return {
        seed,
        activityLog: [event, ...state.activityLog].slice(0, 200)
      };
    }),
    
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
      const newDataset = generateGenericDataset(rowCount, schema.columns, seed);
      
      const histItem: DatasetHistoryItem = {
        timestamp: new Date().toISOString(),
        source: 'synthetic',
        rowCount,
        columnCount: schema.columns.length,
        seed,
        domain: schema.domain
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'dataset_generate',
        description: `Generated synthetic dataset: ${rowCount} rows, ${schema.columns.length} columns (Seed ${seed})`,
        status: 'success'
      };

      set((state) => ({
        dataset: newDataset,
        bitmapIndex: {},
        datasetSource: 'synthetic',
        datasetHistory: [histItem, ...state.datasetHistory].slice(0, 50),
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          datasetGenerations: state.activityCounts.datasetGenerations + 1
        }
      }));
    },

    loadExternalDataset: (newDataset: DatasetRow[], newColumns?: ColumnDefinition[], newDomain?: string, source: 'csv' | 'ai' = 'csv') => {
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

      const histItem: DatasetHistoryItem = {
        timestamp: new Date().toISOString(),
        source,
        rowCount: newDataset.length,
        columnCount: columns.length,
        domain: newDomain || get().schema.domain
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'dataset_import',
        description: `Imported ${source.toUpperCase()} dataset: ${newDataset.length} rows, ${columns.length} columns`,
        status: 'success'
      };

      set(state => ({
        dataset: newDataset,
        bitmapIndex: {},
        rowCount: newDataset.length,
        datasetSource: source,
        schema: {
          ...state.schema,
          domain: newDomain || state.schema.domain,
          columns
        },
        datasetHistory: [histItem, ...state.datasetHistory].slice(0, 50),
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          datasetGenerations: state.activityCounts.datasetGenerations + 1
        }
      }));
    },

    buildIndexes: (columnsToIndex: string[]) => {
      const { dataset } = get();
      if (dataset.length === 0) return;

      const t0 = performance.now();
      const newIndex = buildDatasetBitmapIndex(dataset, columnsToIndex);
      const buildDuration = performance.now() - t0;

      let vectorCount = 0;
      let setBits = 0;
      for (const col of Object.keys(newIndex)) {
        for (const bmp of Object.values(newIndex[col])) {
          vectorCount++;
          setBits += bmp.setBitCount;
        }
      }

      const totalBits = vectorCount * dataset.length;
      const densityPct = totalBits > 0 ? (setBits / totalBits) * 100 : 0;

      const stats: IndexBuildStats = {
        timestamp: new Date().toISOString(),
        buildDurationMs: Number(buildDuration.toFixed(3)),
        indexedColumns: columnsToIndex,
        vectorCount,
        distinctValuesCount: vectorCount,
        totalBits,
        setBits,
        densityPct: Number(densityPct.toFixed(2))
      };

      const event: ActivityLogEvent = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'index_build',
        description: `Built bitmap index: ${vectorCount} vectors across ${columnsToIndex.length} columns in ${buildDuration.toFixed(2)}ms`,
        status: 'success'
      };

      set(state => ({
        bitmapIndex: newIndex,
        lastIndexBuildStats: stats,
        activityLog: [event, ...state.activityLog].slice(0, 200),
        activityCounts: {
          ...state.activityCounts,
          indexBuilds: state.activityCounts.indexBuilds + 1
        }
      }));
    }
  };
});
