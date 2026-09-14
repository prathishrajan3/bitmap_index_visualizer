"use client";

import { useEffect, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Play, Pause, FastForward, RotateCcw, AlertOctagon, CloudRain, ShieldAlert, Sunrise, Moon } from 'lucide-react';
import { buildCityBitmapIndex } from '@/lib/city/cityBitmapEngine';
import { applyRushHour, applyHeavyRain, applyMajorAccident, applyAirPollutionEvent, applyCityCrisis } from '@/lib/city/cityScenarios';

export default function CityTimeline() {
  const { 
    dataset, setDataset, 
    simulationRunning, setSimulationRunning, 
    simulationSpeed, setSimulationSpeed,
    activeScenario, setActiveScenario,
    timeOfDay, setTimeOfDay,
    weather, setWeather
  } = useCityStore();

  const [tick, setTick] = useState(0);

  // Live simulation loop
  useEffect(() => {
    if (!simulationRunning) return;

    const interval = setInterval(() => {
      setTick(t => t + 1);
      
      // In a real simulation, we would mutate data dynamically based on time/weather.
      // Here, we just do a minor jitter to force index rebuilds to demonstrate performance.
      const jitteredDataset = dataset.map(e => ({
        ...e,
        // Minor continuous changes
        vehicleDensity: Math.max(0, e.vehicleDensity + (Math.random() * 4 - 2)),
        // Randomly flip a few sensors to prove dynamic indexing works
        sensorStatus: Math.random() > 0.999 ? (e.sensorStatus === 'Active' ? 'Warning' : 'Active') : e.sensorStatus
      }));

      const newIndex = buildCityBitmapIndex(jitteredDataset);
      setDataset(jitteredDataset, newIndex);

    }, 1000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [simulationRunning, simulationSpeed, dataset, setDataset]);

  const triggerScenario = (scenarioName: string, mutationFunc: any) => {
    setActiveScenario(scenarioName);
    const newData = mutationFunc(dataset);
    const newIndex = buildCityBitmapIndex(newData);
    setDataset(newData, newIndex);
  };

  return (
    <div className="bg-[#0d0d0f]/90 backdrop-blur-md border border-neutral-800 rounded-lg p-4 shadow-2xl flex flex-col gap-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button 
            onClick={() => setSimulationRunning(!simulationRunning)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${simulationRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
          >
            {simulationRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          
          {/* Speed */}
          <div className="flex bg-[#151518] rounded-md border border-neutral-800 overflow-hidden">
            {[1, 2, 5].map(speed => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-3 py-1.5 text-xs font-mono transition-colors ${simulationSpeed === speed ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:bg-neutral-800'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Global States */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-amber-500/70 bg-amber-500/10 px-2 py-1 rounded">
            {timeOfDay === 'Morning' || timeOfDay === 'Afternoon' ? <Sunrise className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            <span>{timeOfDay}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400/70 bg-blue-400/10 px-2 py-1 rounded">
            <CloudRain className="w-3 h-3" />
            <span>{weather}</span>
          </div>
        </div>
      </div>

      {/* Scenarios (Inject events into the dataset) */}
      <div className="border-t border-neutral-800 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-2">Simulate Events</p>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button onClick={() => triggerScenario('Rush Hour', applyRushHour)} className="flex-shrink-0 px-3 py-1.5 rounded-md bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors">
            Rush Hour
          </button>
          <button onClick={() => triggerScenario('Heavy Rain', applyHeavyRain)} className="flex-shrink-0 px-3 py-1.5 rounded-md bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors">
            Heavy Rain
          </button>
          <button onClick={() => triggerScenario('Major Accident', applyMajorAccident)} className="flex-shrink-0 px-3 py-1.5 rounded-md bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors">
            Major Accident
          </button>
          <button onClick={() => triggerScenario('Pollution Event', applyAirPollutionEvent)} className="flex-shrink-0 px-3 py-1.5 rounded-md bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors">
            Pollution Event
          </button>
          <button onClick={() => triggerScenario('City Crisis', applyCityCrisis)} className="flex-shrink-0 px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 transition-colors flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Multi-Crisis
          </button>
        </div>
        {activeScenario !== 'None' && (
          <div className="mt-2 text-[10px] text-emerald-500/70">
            Active: {activeScenario} (Index rebuilt in real-time)
          </div>
        )}
      </div>
    </div>
  );
}
