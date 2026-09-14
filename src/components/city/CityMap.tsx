"use client";

import { useMemo, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { motion, AnimatePresence } from 'framer-motion';
import { DISTRICTS } from '@/lib/city/cityGenerator';
import { HelpCircle, Info } from 'lucide-react';

const DISTRICT_PATHS = [
  "M 30,30 L 60,25 L 75,50 L 55,75 L 25,60 Z", 
  "M 60,25 L 85,15 L 100,40 L 75,50 Z", 
  "M 55,75 L 75,50 L 95,70 L 70,95 Z", 
  "M 75,50 L 100,40 L 115,65 L 95,70 Z", 
  "M 15,45 L 30,30 L 25,60 L 10,75 Z", 
  "M 100,40 L 130,30 L 140,55 L 115,65 Z", 
  "M 25,60 L 55,75 L 45,100 L 15,90 Z", 
  "M 70,95 L 95,70 L 110,90 L 80,110 Z", 
  "M 15,90 L 45,100 L 60,120 L 25,115 Z", 
  "M 115,65 L 140,55 L 150,80 L 125,95 Z" 
];

const SVG_VIEWBOX_WIDTH = 160;
const SVG_VIEWBOX_HEIGHT = 130;

export default function CityMap() {
  const { dataset, queryResultEntityIds, activeQuery, heatmapMode, timeOfDay, weather, activeScenario } = useCityStore();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const renderedEntities = useMemo(() => {
    return dataset.map(entity => {
      const isMatch = activeQuery ? queryResultEntityIds.has(entity.id) : false;
      const isNormal = !activeQuery || !isMatch;
      
      let fillColor = '#10b981'; // emerald
      if (heatmapMode === 'Traffic') {
        if (entity.trafficLevel === 'Severe') fillColor = '#ef4444';
        else if (entity.trafficLevel === 'Heavy') fillColor = '#f97316';
        else if (entity.trafficLevel === 'Medium') fillColor = '#eab308';
        else fillColor = '#34d399';
      } else if (heatmapMode === 'Emergency' || heatmapMode === 'Risk') {
        if (entity.emergencyPriority === 'Critical' || entity.riskLevel === 'Critical') fillColor = '#ef4444';
        else if (entity.emergencyPriority === 'High' || entity.riskLevel === 'High') fillColor = '#f97316';
        else if (entity.emergencyPriority === 'Medium') fillColor = '#eab308';
      } else if (heatmapMode === 'Pollution') {
        if (entity.airQuality === 'Hazardous') fillColor = '#7e22ce'; 
        else if (entity.airQuality === 'Poor') fillColor = '#ef4444';
        else if (entity.airQuality === 'Moderate') fillColor = '#eab308';
      } else {
        if (entity.entityType === 'Hospital') fillColor = '#ef4444';
        else if (entity.entityType === 'Intersection') fillColor = '#3b82f6';
        else if (entity.entityType === 'PowerSubstation') fillColor = '#eab308';
      }

      // Visual Hierarchy Rules
      const opacity = activeQuery ? (isMatch ? 1 : 0.1) : 0.3;
      const r = activeQuery && isMatch ? 1.2 : 0.4;
      const className = isMatch ? "transition-all duration-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" : "transition-all duration-500";

      return (
        <circle
          key={entity.id}
          cx={entity.x}
          cy={entity.y}
          r={r}
          fill={fillColor}
          opacity={opacity}
          className={`${className} cursor-crosshair`}
          onMouseEnter={() => setHoveredEntity(entity)}
          onMouseLeave={() => setHoveredEntity(null)}
        />
      );
    });
  }, [dataset, activeQuery, queryResultEntityIds, heatmapMode]);

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

      {/* MAP LEGEND */}
      <div className="absolute bottom-6 left-6 z-10 bg-[#0d0d0f]/90 backdrop-blur-md border border-neutral-800 rounded-lg p-3 shadow-xl">
        <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-2">MAP LEGEND</h3>
        <div className="flex flex-col gap-1.5 text-[10px] text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 opacity-30"></div>
            <span>Normal Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
            <span className="text-emerald-400 font-medium">Query Match</span>
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
              <div className={`text-right ${hoveredEntity.trafficLevel === 'Severe' ? 'text-red-400' : 'text-neutral-300'}`}>{hoveredEntity.trafficLevel}</div>
              
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
                <li><strong className="text-white">Ask a question</strong> in natural language in the right sidebar.</li>
                <li><strong className="text-white">AI converts it</strong> into structured Boolean conditions.</li>
                <li><strong className="text-white">Bitmap Indexes</strong> retrieve matching data using fast bitwise vector math.</li>
                <li><strong className="text-white">Matching entities</strong> are instantly highlighted on this map.</li>
                <li><strong className="text-white">Performance metrics</strong> show how much faster Bitmap is compared to traditional Table Scans.</li>
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

          {/* Entities Layer */}
          <g className="entities">
            {renderedEntities}
          </g>

          {/* Highlight pulses for matching entities */}
          {activeQuery && (
            <g className="pulses pointer-events-none">
              {dataset.filter(e => queryResultEntityIds.has(e.id)).slice(0, 30).map(entity => (
                <motion.circle
                  key={`pulse-${entity.id}`}
                  cx={entity.x}
                  cy={entity.y}
                  r={1}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="0.3"
                  initial={{ r: 1.2, opacity: 0.8 }}
                  animate={{ r: 6, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
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
