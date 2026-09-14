"use client";

import { useEffect, useState, useMemo } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { generateCityData } from '@/lib/city/cityGenerator';
import { buildCityBitmapIndex } from '@/lib/city/cityBitmapEngine';
import CityMap from './CityMap';
import CityHeader from './CityHeader';
import CitySidebar from './CitySidebar';
import CityTimeline from './CityTimeline';
import BitmapQueryVisualizer from './BitmapQueryVisualizer';

export default function CityDigitalTwin() {
  const { dataset, setDataset, activeQuery } = useCityStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial dataset generation
    const initialData = generateCityData({
      seed: 42,
      count: 2000,
      timeOfDay: 'Morning',
      weather: 'Clear',
      scenario: 'None'
    });
    const initialIndex = buildCityBitmapIndex(initialData);
    setDataset(initialData, initialIndex);
    setLoading(false);
  }, [setDataset]);

  if (loading || dataset.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-mono">INITIALIZING NOVA CITY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0c] font-sans">
      <CityHeader />
      
      <div className="flex flex-1 overflow-hidden relative bg-[#0a0a0c]">
        {/* Main Map Area (Left ~70%) */}
        <main className="flex-1 relative flex flex-col border-r border-neutral-800/50">
          <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#111115] to-[#050505]">
            <CityMap />
            
            {/* Absolute positioning for Map Legend / Status handled inside CityMap */}
          </div>
          
          {/* Horizontal Simulation Timeline Bar (Bottom) */}
          <div className="h-auto border-t border-neutral-800/50 bg-[#0d0d0f]">
            <CityTimeline />
          </div>
        </main>

        {/* Right City Intelligence Sidebar (~30%) */}
        <aside className="w-[400px] xl:w-[450px] 2xl:w-[500px] flex-shrink-0 bg-[#0d0d0f] flex flex-col z-20 shadow-2xl">
          <CitySidebar />
        </aside>
      </div>
    </div>
  );
}
