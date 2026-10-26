"use client";

import { useMemo, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS, DISTRICT_PATHS } from '@/lib/city/cityGenerator';
import { HelpCircle, Info, Sparkles, X } from 'lucide-react';

const SVG_VIEWBOX_WIDTH = 160;
const SVG_VIEWBOX_HEIGHT = 130;

export default function CityMap() {
  const { 
    dataset, 
    queryResultEntityIds, 
    activeQuery, 
    heatmapMode, 
    timeOfDay, 
    weather, 
    activeScenario,
    setActiveQuery,
    setLastBenchmarkResult
  } = useCityStore();

  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const { backgroundEntities, matchingEntities } = useMemo(() => {
    const bg: any[] = [];
    const match: any[] = [];

    dataset.forEach(entity => {
      const isMatch = activeQuery ? queryResultEntityIds.has(entity.id) : false;

      let baseFillColor = '#10b981'; // emerald default
      if (heatmapMode === 'Traffic') {
        if (entity.trafficLevel === 'Severe') baseFillColor = '#ef4444';
        else if (entity.trafficLevel === 'Heavy') baseFillColor = '#f97316';
        else if (entity.trafficLevel === 'Medium') baseFillColor = '#eab308';
        else baseFillColor = '#34d399';
      } else if (heatmapMode === 'Emergency' || heatmapMode === 'Risk') {
        if (entity.emergencyPriority === 'Critical' || entity.riskLevel === 'Critical') baseFillColor = '#ef4444';
        else if (entity.emergencyPriority === 'High' || entity.riskLevel === 'High') baseFillColor = '#f97316';
        else if (entity.emergencyPriority === 'Medium') baseFillColor = '#eab308';
      } else if (heatmapMode === 'Pollution') {
        if (entity.airQuality === 'Hazardous') baseFillColor = '#7e22ce'; 
        else if (entity.airQuality === 'Poor') baseFillColor = '#ef4444';
        else if (entity.airQuality === 'Moderate') baseFillColor = '#eab308';
      } else {
        if (entity.entityType === 'Hospital') baseFillColor = '#ef4444';
        else if (entity.entityType === 'Intersection') baseFillColor = '#3b82f6';
        else if (entity.entityType === 'PowerSubstation') baseFillColor = '#eab308';
      }

      if (isMatch) {
        match.push({ entity, baseFillColor });
      } else {
        bg.push({ entity, baseFillColor });
      }
    });

    return { backgroundEntities: bg, matchingEntities: match };
  }, [dataset, activeQuery, queryResultEntityIds, heatmapMode]);

  const handleClearQuery = () => {
    setActiveQuery(null, new Set());
    setLastBenchmarkResult(null);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* MAP STATUS BAR */}
      <div className="absolute top-6 left-6 z-10 bg-[#0d0d0f]/90 backdrop-blur-md border border-neutral-800 rounded-lg p-3 shadow-xl">
        <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">CITY STATE</h3>
        <div className="flex flex-col gap-0.5 text-xs text-neutral-300">
          <div><span className="text-neutral-500">Conditions:</span> {timeOfDay} • {weather}</div>
          <div><span className="text-neutral-500">Scale:</span> 2,000 entities in 10 districts</div>
          {activeScenario !== 'None' && (
            <div className="text-amber-400 mt-1 font-mono text-[10px] bg-amber-500/10 px-1 py-0.5 rounded w-max border border-amber-500/20">
              ⚠ SCENARIO: {activeScenario}
            </div>
          )}
        </div>
      </div>

      {/* TOP QUERY RESULTS HUD BANNER */}
      <AnimatePresence>
        {activeQuery && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-[#0d0d0f]/95 backdrop-blur-md border border-emerald-500/50 rounded-xl px-5 py-2.5 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center gap-4"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  {matchingEntities.length} Matching Entities Highlighted
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  BITMAP RESULT
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">
                Showing all matching records in real-time
              </div>
            </div>
            <button
              onClick={handleClearQuery}
              className="text-xs text-neutral-400 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 px-3 py-1 rounded-md border border-neutral-700 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAP LEGEND */}
      <div className="absolute bottom-6 left-6 z-10 bg-[#0d0d0f]/90 backdrop-blur-md border border-neutral-800 rounded-lg p-3 shadow-xl">
        <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2">MAP LEGEND</h3>
        <div className="flex flex-col gap-1.5 text-[10px] text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-30"></div>
            <span>Normal Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc] border border-white"></div>
            <span className="text-emerald-300 font-bold">Query Match ({activeQuery ? matchingEntities.length : 0})</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-neutral-800">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Hospital / Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Intersection</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS BUTTON */}
      <div className="absolute top-6 right-6 z-10">
        <button 
          onClick={() => setShowHowItWorks(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs text-neutral-300 rounded-md transition-colors shadow-lg"
        >
          <HelpCircle className="w-3.5 h-3.5" /> How it works
        </button>
      </div>

      {/* ENTITY HOVER TOOLTIP */}
      <AnimatePresence>
        {hoveredEntity && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 bg-[#0d0d0f] border border-neutral-700 rounded-lg shadow-2xl p-3 pointer-events-none min-w-[160px]"
            style={{ 
              left: `calc(50% + ${((hoveredEntity.x - SVG_VIEWBOX_WIDTH/2) / SVG_VIEWBOX_WIDTH) * 100}%)`, 
              top: `calc(50% + ${((hoveredEntity.y - SVG_VIEWBOX_HEIGHT/2) / SVG_VIEWBOX_HEIGHT) * 100}%)`,
              transform: 'translate(-50%, -120%)'
            }}
          >
            <div className="text-[10px] font-mono text-emerald-500 mb-1">ENTITY #{hoveredEntity.id.split('-')[1] || hoveredEntity.id}</div>
            <div className="font-bold text-xs text-white mb-2">{hoveredEntity.entityType}</div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
              <div className="text-neutral-500">District</div>
              <div className="text-neutral-300 truncate text-right">{hoveredEntity.district}</div>
              
              <div className="text-neutral-500">Traffic</div>
              <div className={`text-right ${hoveredEntity.trafficLevel === 'Severe' ? 'text-red-400 font-bold' : 'text-neutral-300'}`}>{hoveredEntity.trafficLevel}</div>
              
              <div className="text-neutral-500">Air Quality</div>
              <div className={`text-right ${hoveredEntity.airQuality === 'Hazardous' || hoveredEntity.airQuality === 'Poor' ? 'text-amber-400' : 'text-neutral-300'}`}>{hoveredEntity.airQuality}</div>
              
              <div className="text-neutral-500">Risk Level</div>
              <div className={`text-right ${hoveredEntity.riskLevel === 'Critical' ? 'text-red-400 font-bold' : 'text-neutral-300'}`}>{hoveredEntity.riskLevel}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOW IT WORKS MODAL */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowHowItWorks(false)}
          >
            <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Info className="text-emerald-400" /> How Nova City Works
              </h2>
              <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                NOVA CITY simulates a smart city using 2,000 active entities. It demonstrates how Bitmap Indexes process complex analytical queries instantly.
              </p>
              <ol className="flex flex-col gap-3 text-xs text-neutral-300 list-decimal pl-5">
                <li><strong className="text-white">Ask a question</strong> or click Generate Smart Query to pick from a pool of 100 queries.</li>
                <li><strong className="text-white">Click Analyze City</strong> to evaluate the query using bitwise vector operations.</li>
                <li><strong className="text-white">Bitmap Indexes</strong> retrieve matching data in sub-millisecond execution times.</li>
                <li><strong className="text-white">Matching entities</strong> are prominently highlighted in radiant neon cyan on the map.</li>
                <li><strong className="text-white">Performance metrics</strong> show the speedup compared to traditional Table Scans.</li>
              </ol>
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="mt-6 w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative w-full h-full max-w-5xl max-h-[85vh]">
        <svg
          viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
          className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(16,185,129,0.05)]"
        >
          {/* Base Districts Layer */}
          <g className="districts">
            {DISTRICT_PATHS.map((path, i) => (
              <motion.path
                key={DISTRICTS[i]}
                d={path}
                fill={hoveredDistrict === DISTRICTS[i] ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.01)'}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="0.3"
                onMouseEnter={() => setHoveredDistrict(DISTRICTS[i])}
                onMouseLeave={() => setHoveredDistrict(null)}
                className="transition-colors cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            ))}
          </g>

          {/* District Labels */}
          <g className="labels">
            {DISTRICT_PATHS.map((path, i) => {
              const match = path.match(/M\s*([\d.]+),([\d.]+)/);
              const x = match ? parseFloat(match[1]) + 5 : 0;
              const y = match ? parseFloat(match[2]) + 10 : 0;
              return (
                <text
                  key={`label-${DISTRICTS[i]}`}
                  x={x}
                  y={y}
                  fill="rgba(255, 255, 255, 0.25)"
                  fontSize="2"
                  fontWeight="bold"
                  className="font-mono uppercase tracking-[0.2em] pointer-events-none"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  {DISTRICTS[i]}
                </text>
              );
            })}
          </g>

          {/* Layer 1: Background Non-Matching Entities */}
          <g className="background-entities">
            {backgroundEntities.map(({ entity, baseFillColor }) => (
              <circle
                key={entity.id}
                cx={entity.x}
                cy={entity.y}
                r={activeQuery ? 0.35 : 0.4}
                fill={baseFillColor}
                opacity={activeQuery ? 0.08 : 0.3}
                className="transition-all duration-300 cursor-crosshair"
                onMouseEnter={() => setHoveredEntity(entity)}
                onMouseLeave={() => setHoveredEntity(null)}
              />
            ))}
          </g>

          {/* Layer 2: Matching Entities Foreground Layer (Highlighted with bright glow) */}
          <g className="matching-entities">
            {matchingEntities.map(({ entity }) => (
              <circle
                key={entity.id}
                cx={entity.x}
                cy={entity.y}
                r={2.2}
                fill="#00ffcc"
                stroke="#ffffff"
                strokeWidth="0.4"
                opacity={1}
                className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(0,255,204,0.9)] cursor-pointer"
                onMouseEnter={() => setHoveredEntity(entity)}
                onMouseLeave={() => setHoveredEntity(null)}
              />
            ))}
          </g>

          {/* Layer 3: Highlight pulses for matching entities */}
          {activeQuery && (
            <g className="pulses pointer-events-none">
              {matchingEntities.slice(0, 40).map(({ entity }) => (
                <motion.circle
                  key={`pulse-${entity.id}`}
                  cx={entity.x}
                  cy={entity.y}
                  r={2.2}
                  fill="none"
                  stroke="#00ffcc"
                  strokeWidth="0.4"
                  initial={{ r: 2.2, opacity: 0.9 }}
                  animate={{ r: 7.5, opacity: 0 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Floating coordinate aesthetic */}
        <div className="absolute top-0 left-0 border-l border-t border-emerald-500/10 w-8 h-8 pointer-events-none" />
        <div className="absolute top-0 right-0 border-r border-t border-emerald-500/10 w-8 h-8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 border-l border-b border-emerald-500/10 w-8 h-8 pointer-events-none" />
        <div className="absolute bottom-0 right-0 border-r border-b border-emerald-500/10 w-8 h-8 pointer-events-none" />
      </div>
    </div>
  );
}
