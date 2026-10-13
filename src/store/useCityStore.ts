import { create } from 'zustand';
import { CityEntity, CityBitmapIndex, CityQueryNode } from '@/lib/city/cityTypes';
import { 
  CityIssueFilterState, 
  CityScanScope, 
  DEFAULT_CITY_ISSUE_FILTERS 
} from '@/lib/city/cityQueries';
import { CityBenchmarkStatistics } from '@/lib/city/cityStatistics';
import { CityScalingRunRecord, ActivityLogEvent } from '@/utils/reportTypes';

interface CityActivityCounts {
  queryExecutions: number;
  issueScans: number;
  scalingExperiments: number;
  benchmarkRuns: number;
}

export interface CityState {
  // Data
  dataset: CityEntity[];
  bitmapIndex: CityBitmapIndex;
  
  // Simulation
  simulationRunning: boolean;
  simulationSpeed: number; // 1, 2, 5, 10
  activeScenario: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  weather: 'Clear' | 'Cloudy' | 'Rain' | 'Storm';
  
  // UI & Query
  selectedEntityId: string | null;
  selectedDistrict: string | null;
  issueFilters: CityIssueFilterState;
  scanScope: CityScanScope;
  isScalingBenchmarkRunning: boolean;
  activeQuery: CityQueryNode | null;
  queryResultEntityIds: Set<string>;
  heatmapMode: 'None' | 'Traffic' | 'Pollution' | 'Emergency' | 'Risk';
  demoMode: boolean;
  educationalMode: boolean;
  
  // Single-Query Benchmark
  lastBenchmarkResult: CityBenchmarkStatistics | null;

  // Scaling Experiment Run (Shared for Downloadable Reports)
  scalingRunRecord: CityScalingRunRecord | null;

  // City Activities Log & Metrics
  cityActivityLog: ActivityLogEvent[];
  cityActivityCounts: CityActivityCounts;

  // Actions
  setDataset: (data: CityEntity[], index: CityBitmapIndex) => void;
  setSimulationRunning: (running: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  setActiveScenario: (scenario: string) => void;
  setTimeOfDay: (time: 'Morning' | 'Afternoon' | 'Evening' | 'Night') => void;
  setWeather: (weather: 'Clear' | 'Cloudy' | 'Rain' | 'Storm') => void;
  setSelectedEntityId: (id: string | null) => void;
  setSelectedDistrict: (district: string | null) => void;
  setIssueFilters: (filters: Partial<CityIssueFilterState> | ((prev: CityIssueFilterState) => CityIssueFilterState)) => void;
  setScanScope: (scope: CityScanScope) => void;
  setIsScalingBenchmarkRunning: (running: boolean) => void;
  setActiveQuery: (query: CityQueryNode | null, resultIds: Set<string>) => void;
  setHeatmapMode: (mode: 'None' | 'Traffic' | 'Pollution' | 'Emergency' | 'Risk') => void;
  setDemoMode: (active: boolean) => void;
  setEducationalMode: (active: boolean) => void;
  setLastBenchmarkResult: (result: CityBenchmarkStatistics | null) => void;
  setScalingRunRecord: (record: CityScalingRunRecord | null) => void;
  logCityActivity: (type: string, description: string, status?: 'success' | 'failure' | 'info', details?: string) => void;
}

export const useCityStore = create<CityState>((set) => ({
  dataset: [],
  bitmapIndex: {},
  
  simulationRunning: false,
  simulationSpeed: 1,
  activeScenario: 'None',
  timeOfDay: 'Morning',
  weather: 'Clear',
  
  selectedEntityId: null,
  selectedDistrict: 'Central Business District',
  issueFilters: { ...DEFAULT_CITY_ISSUE_FILTERS },
  scanScope: 'district',
  isScalingBenchmarkRunning: false,
  activeQuery: null,
  queryResultEntityIds: new Set(),
  heatmapMode: 'None',
  demoMode: false,
  educationalMode: false,
  
  lastBenchmarkResult: null,
  scalingRunRecord: null,

  cityActivityLog: [],
  cityActivityCounts: {
    queryExecutions: 0,
    issueScans: 0,
    scalingExperiments: 0,
    benchmarkRuns: 0
  },
  
  setDataset: (data, index) => set({ dataset: data, bitmapIndex: index }),
  setSimulationRunning: (running) => set({ simulationRunning: running }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setWeather: (weather) => set({ weather }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setSelectedDistrict: (district) => set({ selectedDistrict: district }),
  setIssueFilters: (filters) => set((state) => ({
    issueFilters: typeof filters === 'function' ? filters(state.issueFilters) : { ...state.issueFilters, ...filters }
  })),
  setScanScope: (scope) => set({ scanScope: scope }),
  setIsScalingBenchmarkRunning: (running) => set({ isScalingBenchmarkRunning: running }),
  setActiveQuery: (query, resultIds) => set((state) => {
    const isNewQuery = Boolean(query);
    const event: ActivityLogEvent | null = isNewQuery ? {
      id: `city-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'query_exec',
      description: `Query executed: ${resultIds.size} entities matched in ${state.scanScope === 'city' ? 'City-Wide Scope' : state.selectedDistrict}`,
      status: 'success'
    } : null;

    return {
      activeQuery: query,
      queryResultEntityIds: resultIds,
      cityActivityLog: event ? [event, ...state.cityActivityLog].slice(0, 200) : state.cityActivityLog,
      cityActivityCounts: {
        ...state.cityActivityCounts,
        queryExecutions: state.cityActivityCounts.queryExecutions + (isNewQuery ? 1 : 0)
      }
    };
  }),
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),
  setDemoMode: (active) => set({ demoMode: active }),
  setEducationalMode: (active) => set({ educationalMode: active }),
  setLastBenchmarkResult: (result) => set((state) => {
    const event: ActivityLogEvent | null = result ? {
      id: `city-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'benchmark_eval',
      description: `Benchmark evaluated: Winner ${result.winner.toUpperCase()} (${result.speedup ? result.speedup.toFixed(1) + 'x speedup' : 'inconclusive'})`,
      status: result.resultSetsEqual ? 'success' : 'failure'
    } : null;

    return {
      lastBenchmarkResult: result,
      cityActivityLog: event ? [event, ...state.cityActivityLog].slice(0, 200) : state.cityActivityLog,
      cityActivityCounts: {
        ...state.cityActivityCounts,
        benchmarkRuns: state.cityActivityCounts.benchmarkRuns + (result ? 1 : 0)
      }
    };
  }),
  setScalingRunRecord: (record) => set((state) => ({
    scalingRunRecord: record,
    cityActivityCounts: {
      ...state.cityActivityCounts,
      scalingExperiments: state.cityActivityCounts.scalingExperiments + (record && record.status === 'completed' ? 1 : 0)
    }
  })),
  logCityActivity: (type, description, status = 'info', details) => set((state) => {
    const event: ActivityLogEvent = {
      id: `city-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      description,
      status,
      details
    };
    return {
      cityActivityLog: [event, ...state.cityActivityLog].slice(0, 200)
    };
  })
}));
