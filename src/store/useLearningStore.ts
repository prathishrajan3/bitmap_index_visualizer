import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ModuleProgress {
  id: string;
  title: string;
  completed: boolean;
  score: number;
}

interface LearningState {
  modules: Record<string, ModuleProgress>;
  currentModuleId: string | null;
  overallMastery: number; // 0 to 100
  
  // Actions
  completeModule: (id: string, score: number) => void;
  setCurrentModule: (id: string | null) => void;
  calculateMastery: () => void;
  resetProgress: () => void;
}

const INITIAL_MODULES = {
  'intro': { id: 'intro', title: 'Introduction to Indexes', completed: false, score: 0 },
  'construction': { id: 'construction', title: 'Bitmap Construction', completed: false, score: 0 },
  'algebra': { id: 'algebra', title: 'Bitmap Algebra', completed: false, score: 0 },
  'compression': { id: 'compression', title: 'Data Compression', completed: false, score: 0 },
  'execution': { id: 'execution', title: 'Query Execution', completed: false, score: 0 }
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      modules: INITIAL_MODULES,
      currentModuleId: null,
      overallMastery: 0,

      completeModule: (id, score) => {
        set((state) => ({
          modules: {
            ...state.modules,
            [id]: { ...state.modules[id], completed: true, score }
          }
        }));
        get().calculateMastery();
      },

      setCurrentModule: (id) => set({ currentModuleId: id }),

      calculateMastery: () => {
        const { modules } = get();
        const mods = Object.values(modules);
        const completed = mods.filter(m => m.completed).length;
        const totalScore = mods.reduce((sum, m) => sum + (m.completed ? m.score : 0), 0);
        
        const avgScore = completed === 0 ? 0 : totalScore / completed;
        const progressFactor = completed / mods.length;
        
        // Mastery is a combination of how many modules are done and the scores on them
        const overallMastery = Math.round(progressFactor * avgScore);
        
        set({ overallMastery });
      },

      resetProgress: () => {
        set({
          modules: {
            'intro': { id: 'intro', title: 'Introduction to Indexes', completed: false, score: 0 },
            'construction': { id: 'construction', title: 'Bitmap Construction', completed: false, score: 0 },
            'algebra': { id: 'algebra', title: 'Bitmap Algebra', completed: false, score: 0 },
            'compression': { id: 'compression', title: 'Data Compression', completed: false, score: 0 },
            'execution': { id: 'execution', title: 'Query Execution', completed: false, score: 0 }
          },
          currentModuleId: null,
          overallMastery: 0
        });
      }
    }),
    {
      name: 'bitmap-learning-progress-v2', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
