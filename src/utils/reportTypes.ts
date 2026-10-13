import { CityBenchmarkStatistics } from '@/lib/city/cityStatistics';
import { CityQueryNode } from '@/lib/city/cityTypes';

export type ReportFormat = 'pdf' | 'docx' | 'txt';
export type ReportType = 'lab' | 'city';

export interface ActivityLogEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  status: 'success' | 'failure' | 'info';
  details?: string;
}

export interface ColumnStatSummary {
  name: string;
  type: string;
  cardinality: number;
  distribution?: string;
  missingCount: number;
  sampleDistinctValues: string[];
}

export interface BitmapVectorSummary {
  columnName: string;
  valueName: string;
  bitsPreview: string;
  count: number;
  densityPct: number;
}

export interface AlgebraOperationSummary {
  operandA: string;
  operator: 'AND' | 'OR' | 'XOR';
  operandB: string;
  matchCount: number;
  totalRows: number;
  selectivityPct: number;
  bitsPreview: string;
  timestamp: string;
}

export interface QueryExecutionSummary {
  sql: string;
  timestamp: string;
  status: 'success' | 'failure';
  executionTimeMs?: number;
  returnedRows?: number;
  error?: string;
  sampleRows?: Record<string, unknown>[];
}

export interface QuizAttemptSummary {
  score: number;
  total: number;
  percentage: number;
  difficulty: string;
  source: string;
  completedAt: string;
  status: 'completed' | 'in_progress';
}

export interface LearningModuleSummary {
  id: string;
  title: string;
  completed: boolean;
  score: number;
}

export interface CityScalingPointSummary {
  size: number;
  genTimeMs: number;
  buildTimeMs: number;
  memoryBytes: number;
  stats: CityBenchmarkStatistics;
}

export interface CityScalingRunRecord {
  runId: string;
  timestamp: string;
  querySummary: string;
  scope: 'district' | 'city';
  district: string | null;
  issueLabels: string[];
  ast: CityQueryNode;
  datasetSizes: number[];
  resultsBySize: Record<number, {
    genTimeMs: number;
    buildTimeMs: number;
    memoryBytes: number;
    stats: CityBenchmarkStatistics;
  }>;
  status: 'completed' | 'in_progress' | 'failed' | 'interrupted';
  error?: string;
}

export interface LaboratoryReportData {
  reportType: 'lab';
  title: string;
  generatedAt: string;
  sessionStartedAt: string;
  executiveSummary: string[];
  configuration: { label: string; value: string }[];
  
  datasetOverview: {
    rowCount: number;
    columnCount: number;
    source: 'synthetic' | 'csv' | 'ai';
    seed?: number;
    domain: string;
    duplicateRows: number;
    columns: ColumnStatSummary[];
    sampleRows: Record<string, unknown>[];
  };
  datasetHistory: {
    timestamp: string;
    source: string;
    rowCount: number;
    columnCount: number;
    seed?: number;
  }[];

  bitmapIndexStats: {
    built: boolean;
    indexedColumns: string[];
    vectorCount: number;
    distinctValuesCount: number;
    bitLength: number;
    totalLogicalBits: number;
    setBitsCount: number;
    overallDensityPct: number;
    buildDurationMs?: number;
    estimatedPayloadBytes?: number;
    vectors: BitmapVectorSummary[];
  };

  algebraStats: {
    totalOperations: number;
    operations: AlgebraOperationSummary[];
  };

  queryStats: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    queries: QueryExecutionSummary[];
  };

  quizStats: {
    completed: boolean;
    attemptsCount: number;
    latestAttempt?: QuizAttemptSummary;
    allAttempts: QuizAttemptSummary[];
  };

  learningStats: {
    overallMastery: number;
    modules: LearningModuleSummary[];
  };

  activitySummary: {
    totalEvents: number;
    counts: Record<string, number>;
    timeline: ActivityLogEvent[];
  };

  processingSteps: string[];
  intermediateResults: string[];
  finalOutput: string[];
  methodologyNotes: string[];
}

export interface CityReportData {
  reportType: 'city';
  title: string;
  generatedAt: string;
  executiveSummary: string[];
  simulationConfig: { label: string; value: string }[];

  datasetStats: {
    totalEntities: number;
    districtCounts: Record<string, number>;
    entityTypeCounts: Record<string, number>;
    trafficDistribution: Record<string, number>;
    riskDistribution: Record<string, number>;
    airQualityDistribution: Record<string, number>;
  };

  activeQuery: {
    executed: boolean;
    description: string;
    scope: string;
    district: string | null;
    matchingCount: number;
    matchingPct: number;
  };

  currentBenchmark?: {
    hasBenchmark: boolean;
    stats?: CityBenchmarkStatistics;
  };

  scalingExperiment?: {
    hasScaling: boolean;
    runRecord?: CityScalingRunRecord;
    keyFindings: string[];
    breakEvenConclusion: string;
  };

  activitySummary: {
    totalEvents: number;
    counts: Record<string, number>;
    timeline: ActivityLogEvent[];
  };

  processingSteps: string[];
  intermediateResults: string[];
  finalOutput: string[];
  methodologyNotes: string[];
}

export type UnifiedReportData = LaboratoryReportData | CityReportData;
export type ReportData = UnifiedReportData;
