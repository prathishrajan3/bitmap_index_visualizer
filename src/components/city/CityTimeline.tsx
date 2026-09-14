"use client";

import { useEffect, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Play, Pause, FastForward, RotateCcw, AlertOctagon, CloudRain, ShieldAlert, Sunrise, Moon } from 'lucide-react';
import { buildCityBitmapIndex } from '@/lib/city/cityBitmapEngine';
import { applyRushHour, applyHeavyRain, applyMajorAccident, applyAirPollutionEvent, applyCityCrisis } from '@/lib/city/cityScenarios';
import CityTooltip from './ui/CityTooltip';

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
    <div className="w-full h-16 flex items-center justify-between px-6 border-t border-neutral-800/60 bg-[#070709] shrink-0 z-20">
      
      {/* Left: Simulation Controls & Status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSimulationRunning(!simulationRunning)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${simulationRunning ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'}`}
          >
            {simulationRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          
          <div className="flex bg-[#111115] rounded border border-neutral-800 overflow-hidden">
            {[1, 2, 5].map(speed => (
              <button
                key={speed}
                onClick={() => setSimulationSpeed(speed)}
                className={`px-2.5 py-1 text-[11px] font-mono transition-colors ${simulationSpeed === speed ? 'bg-neutral-700 text-white' : 'text-neutral-500 hover:bg-neutral-800'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-neutral-800/80"></div>

        <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
          <div className="flex items-center gap-1.5 text-neutral-400">
            {timeOfDay === 'Morning' || timeOfDay === 'Afternoon' ? <Sunrise className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{timeOfDay}</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <CloudRain className="w-3.5 h-3.5" />
            <span>{weather}</span>
          </div>
          {activeScenario !== 'None' && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeScenario}
            </div>
          )}
        </div>
      </div>

      {/* Right: Simulate Events */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 mr-2">Simulate Event:</span>
        <div className="flex gap-2">
          <CityTooltip content="Increase traffic density across all major arteries.">
            <button onClick={() => triggerScenario('Rush Hour', applyRushHour)} className={`px-3 py-1.5 rounded bg-[#111115] hover:bg-neutral-800 border ${activeScenario === 'Rush Hour' ? 'border-amber-500/50 text-amber-400' : 'border-neutral-800 text-neutral-400'} text-[11px] transition-colors`}>
              Rush Hour
            </button>
          </CityTooltip>
          
          <CityTooltip content="Storm reduces visibility and increases risk.">
            <button onClick={() => triggerScenario('Heavy Rain', applyHeavyRain)} className={`px-3 py-1.5 rounded bg-[#111115] hover:bg-neutral-800 border ${activeScenario === 'Heavy Rain' ? 'border-amber-500/50 text-amber-400' : 'border-neutral-800 text-neutral-400'} text-[11px] transition-colors`}>
              Heavy Rain
            </button>
          </CityTooltip>

          <CityTooltip content="A massive traffic collision triggering emergency responses.">
            <button onClick={() => triggerScenario('Major Accident', applyMajorAccident)} className={`px-3 py-1.5 rounded bg-[#111115] hover:bg-neutral-800 border ${activeScenario === 'Major Accident' ? 'border-red-500/50 text-red-400' : 'border-neutral-800 text-neutral-400'} text-[11px] transition-colors`}>
              Major Accident
            </button>
          </CityTooltip>

          <CityTooltip content="Severe industrial smog affects air quality citywide.">
            <button onClick={() => triggerScenario('Pollution Event', applyAirPollutionEvent)} className={`px-3 py-1.5 rounded bg-[#111115] hover:bg-neutral-800 border ${activeScenario === 'Pollution Event' ? 'border-amber-500/50 text-amber-400' : 'border-neutral-800 text-neutral-400'} text-[11px] transition-colors`}>
              Pollution Event
            </button>
          </CityTooltip>

          <CityTooltip content="Catastrophic combination of severe traffic, storms, power failures, and hospital overload.">
            <button onClick={() => triggerScenario('City Crisis', applyCityCrisis)} className={`px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border ${activeScenario === 'City Crisis' ? 'border-red-500 text-red-400 font-bold' : 'border-red-500/30 text-red-400'} text-[11px] transition-colors flex items-center gap-1.5`}>
              <ShieldAlert className="w-3 h-3" /> Multi-Crisis
            </button>
          </CityTooltip>
        </div>
      </div>
    </div>
  );
}
