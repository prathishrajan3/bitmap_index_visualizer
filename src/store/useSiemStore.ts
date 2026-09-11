import { create } from 'zustand';
import { SecurityEvent, SiemBitmapIndex, SecurityField } from '@/lib/siem/types';
import { generateSiemEvents } from '@/lib/siem/generator';
import { buildSiemBitmapIndex } from '@/lib/siem/bitmapEngine';

interface SiemStoreState {
  events: SecurityEvent[];
  rowCount: number;
  indexedFields: SecurityField[];
  bitmapIndex: SiemBitmapIndex;
  activeTab: 'Overview' | 'Explorer' | 'IndexLab' | 'Query' | 'Execution' | 'Investigation' | 'Analytics';
  currentQuery: string;
  
  // Actions
  generateData: (count: number, seed?: number) => void;
  setRowCount: (count: number) => void;
  setIndexedFields: (fields: SecurityField[]) => void;
  setActiveTab: (tab: 'Overview' | 'Explorer' | 'IndexLab' | 'Query' | 'Execution' | 'Investigation' | 'Analytics') => void;
  setCurrentQuery: (query: string) => void;
  buildIndexes: () => void;
}

export const useSiemStore = create<SiemStoreState>((set, get) => ({
  events: [],
  rowCount: 1000,
  indexedFields: ['severity', 'eventType', 'action', 'protocol', 'country', 'threatCategory', 'authenticationResult'],
  bitmapIndex: {},
  activeTab: 'Overview',
  currentQuery: "severity = 'Critical'\nAND action = 'Block'",

  generateData: (count, seed = 12345) => {
    const events = generateSiemEvents(count, seed);
    set({ events, rowCount: count });
    get().buildIndexes();
  },

  setRowCount: (count) => {
    set({ rowCount: count });
  },

  setIndexedFields: (fields) => {
    set({ indexedFields: fields });
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  setCurrentQuery: (query) => {
    set({ currentQuery: query });
  },

  buildIndexes: () => {
    const { events, indexedFields } = get();
    const index = buildSiemBitmapIndex(events, indexedFields);
    set({ bitmapIndex: index });
  }
}));
