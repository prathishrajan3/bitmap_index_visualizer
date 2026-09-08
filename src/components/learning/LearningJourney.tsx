import React from 'react';
import { useLearningStore } from '@/store/useLearningStore';
import { GraduationCap, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export function LearningJourney({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { modules, currentModuleId, setCurrentModule, overallMastery, resetProgress } = useLearningStore();
  const moduleList = Object.values(modules);

  const handleStartModule = (id: string) => {
    setCurrentModule(id);
    
    const tabMap: Record<string, string> = {
      'intro': 'Dataset',
      'construction': 'Builder',
      'algebra': 'Algebra',
      'compression': 'Compression',
      'execution': 'Query'
    };
    
    if (tabMap[id]) {
      onNavigate(tabMap[id]);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full bg-neutral-950 p-6 rounded-lg border border-neutral-800">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-blue-900/10 border border-blue-900/30 p-6 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600/20 rounded-full">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Learning Journey</h2>
            <p className="text-sm text-neutral-400">Complete modules to master Bitmap Indexing.</p>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleList.map((mod, idx) => (
          <div 
            key={mod.id} 
            onClick={() => handleStartModule(mod.id)}
            className={`flex flex-col border p-6 rounded-lg transition-all duration-300 cursor-pointer hover:border-blue-500/50
              ${mod.completed ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-neutral-900 border-neutral-800'}
              ${currentModuleId === mod.id ? 'ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Module {idx + 1}</span>
              {mod.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Circle className="w-5 h-5 text-neutral-600" />
              )}
            </div>
            
            <h3 className={`text-lg font-bold mb-2 ${mod.completed ? 'text-emerald-400' : 'text-white'}`}>
              {mod.title}
            </h3>
            
            <div className="mt-auto pt-6 flex justify-between items-center">
              {mod.completed ? (
                <span className="text-xs text-emerald-500 font-bold uppercase tracking-widest">Completed</span>
              ) : (
                <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Not Started</span>
              )}

              <div className="flex items-center gap-1 text-sm text-blue-400">
                {mod.completed ? 'Review' : 'Start'} <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Reset Progress */}
      <div className="mt-auto text-center pt-8 border-t border-neutral-800">
        <button 
          onClick={resetProgress}
          className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
        >
          Reset Learning Progress
        </button>
      </div>

    </div>
  );
}
