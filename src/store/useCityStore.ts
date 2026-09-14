import { create } from 'zustand';
import { CityEntity, CityBitmapIndex, CityQueryNode } from '@/lib/city/cityTypes';

interface CityState {
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
  activeQuery: CityQueryNode | null;
  queryResultEntityIds: Set<string>;
  heatmapMode: 'None' | 'Traffic' | 'Pollution' | 'Emergency' | 'Risk';
  demoMode: boolean;
  educationalMode: boolean;
  
  // Actions
  setDataset: (data: CityEntity[], index: CityBitmapIndex) => void;
  setSimulationRunning: (running: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  setActiveScenario: (scenario: string) => void;
  setTimeOfDay: (time: 'Morning' | 'Afternoon' | 'Evening' | 'Night') => void;
  setWeather: (weather: 'Clear' | 'Cloudy' | 'Rain' | 'Storm') => void;
  setSelectedEntityId: (id: string | null) => void;
  setActiveQuery: (query: CityQueryNode | null, resultIds: Set<string>) => void;
  setHeatmapMode: (mode: 'None' | 'Traffic' | 'Pollution' | 'Emergency' | 'Risk') => void;
  setDemoMode: (active: boolean) => void;
  setEducationalMode: (active: boolean) => void;
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
  activeQuery: null,
  queryResultEntityIds: new Set(),
  heatmapMode: 'None',
  demoMode: false,
  educationalMode: false,
  
  setDataset: (data, index) => set({ dataset: data, bitmapIndex: index }),
  setSimulationRunning: (running) => set({ simulationRunning: running }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  setWeather: (weather) => set({ weather }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setActiveQuery: (query, resultIds) => set({ activeQuery: query, queryResultEntityIds: resultIds }),
  setHeatmapMode: (mode) => set({ heatmapMode: mode }),
  setDemoMode: (active) => set({ demoMode: active }),
  setEducationalMode: (active) => set({ educationalMode: active }),
}));
