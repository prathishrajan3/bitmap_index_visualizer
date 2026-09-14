"use client";

import { useMemo, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { motion } from 'framer-motion';
import { DISTRICTS } from '@/lib/city/cityGenerator';

// A synthetic path generator for districts to make them look irregular
const DISTRICT_PATHS = [
  "M 30,30 L 60,25 L 75,50 L 55,75 L 25,60 Z", // Central Business District
  "M 60,25 L 85,15 L 100,40 L 75,50 Z", // North Industrial Zone
  "M 55,75 L 75,50 L 95,70 L 70,95 Z", // South Residential Zone
  "M 75,50 L 100,40 L 115,65 L 95,70 Z", // East Transit Hub
  "M 15,45 L 30,30 L 25,60 L 10,75 Z", // West Technology Park
  "M 100,40 L 130,30 L 140,55 L 115,65 Z", // Riverside
  "M 25,60 L 55,75 L 45,100 L 15,90 Z", // University District
  "M 70,95 L 95,70 L 110,90 L 80,110 Z", // Medical District
  "M 15,90 L 45,100 L 60,120 L 25,115 Z", // Old Town
  "M 115,65 L 140,55 L 150,80 L 125,95 Z" // Airport Corridor
];

const SVG_VIEWBOX_WIDTH = 160;
const SVG_VIEWBOX_HEIGHT = 130;

export default function CityMap() {
  const { dataset, queryResultEntityIds, activeQuery, heatmapMode } = useCityStore();
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Memoize entities to avoid re-rendering huge lists unless dataset or query results change
  const renderedEntities = useMemo(() => {
    return dataset.map(entity => {
      const isMatch = activeQuery ? queryResultEntityIds.has(entity.id) : true;
      const opacity = activeQuery ? (isMatch ? 1 : 0.15) : 0.7;
      
      let fillColor = '#10b981'; // default emerald
      if (heatmapMode === 'Traffic') {
        if (entity.trafficLevel === 'Severe') fillColor = '#ef4444';
        else if (entity.trafficLevel === 'Heavy') fillColor = '#f97316';
        else if (entity.trafficLevel === 'Medium') fillColor = '#eab308';
        else fillColor = '#22c55e';
      } else if (heatmapMode === 'Emergency' || heatmapMode === 'Risk') {
        if (entity.emergencyPriority === 'Critical' || entity.riskLevel === 'Critical') fillColor = '#ef4444';
        else if (entity.emergencyPriority === 'High' || entity.riskLevel === 'High') fillColor = '#f97316';
        else if (entity.emergencyPriority === 'Medium') fillColor = '#eab308';
      } else if (heatmapMode === 'Pollution') {
        if (entity.airQuality === 'Hazardous') fillColor = '#7e22ce'; // purple
        else if (entity.airQuality === 'Poor') fillColor = '#ef4444';
        else if (entity.airQuality === 'Moderate') fillColor = '#eab308';
      } else {
        // Default coloring by type
        if (entity.entityType === 'Hospital') fillColor = '#ef4444';
        else if (entity.entityType === 'Intersection') fillColor = '#3b82f6';
        else if (entity.entityType === 'PowerSubstation') fillColor = '#eab308';
      }

      // Ensure that matches stand out visually
      const r = (activeQuery && isMatch) ? (entity.entityType === 'Hospital' ? 1.5 : 1) : 0.4;

      return (
        <circle
          key={entity.id}
          cx={entity.x}
          cy={entity.y}
          r={r}
          fill={fillColor}
          opacity={opacity}
          className="transition-all duration-300 ease-in-out"
        />
      );
    });
  }, [dataset, activeQuery, queryResultEntityIds, heatmapMode]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-8">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative w-full h-full max-w-5xl max-h-[80vh]">
        <svg
          viewBox={`0 0 ${SVG_VIEWBOX_WIDTH} ${SVG_VIEWBOX_HEIGHT}`}
          className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          {/* Base Districts Layer */}
          <g className="districts">
            {DISTRICT_PATHS.map((path, i) => (
              <motion.path
                key={DISTRICTS[i]}
                d={path}
                fill={hoveredDistrict === DISTRICTS[i] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.03)'}
                stroke="rgba(16, 185, 129, 0.2)"
                strokeWidth="0.2"
                onMouseEnter={() => setHoveredDistrict(DISTRICTS[i])}
                onMouseLeave={() => setHoveredDistrict(null)}
                className="transition-colors cursor-pointer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
            ))}
          </g>

          {/* District Labels */}
          <g className="labels">
            {DISTRICT_PATHS.map((path, i) => {
              // Extract first coordinate as label position approx
              const match = path.match(/M\s*([\d.]+),([\d.]+)/);
              const x = match ? parseFloat(match[1]) + 5 : 0;
              const y = match ? parseFloat(match[2]) + 10 : 0;
              return (
                <text
                  key={`label-${DISTRICTS[i]}`}
                  x={x}
                  y={y}
                  fill="rgba(16, 185, 129, 0.5)"
                  fontSize="2"
                  className="font-mono uppercase tracking-wider pointer-events-none"
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
              {dataset.filter(e => queryResultEntityIds.has(e.id)).slice(0, 50).map(entity => (
                <motion.circle
                  key={`pulse-${entity.id}`}
                  cx={entity.x}
                  cy={entity.y}
                  r={1}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="0.5"
                  initial={{ r: 1, opacity: 1 }}
                  animate={{ r: 5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Floating coordinate aesthetic */}
        <div className="absolute top-0 left-0 border-l border-t border-emerald-500/30 w-8 h-8 pointer-events-none" />
        <div className="absolute top-0 right-0 border-r border-t border-emerald-500/30 w-8 h-8 pointer-events-none" />
        <div className="absolute bottom-0 left-0 border-l border-b border-emerald-500/30 w-8 h-8 pointer-events-none" />
        <div className="absolute bottom-0 right-0 border-r border-b border-emerald-500/30 w-8 h-8 pointer-events-none" />
        <div className="absolute top-2 right-4 text-[10px] font-mono text-emerald-500/50">NOVA-CITY :: QUADRANT ALPHA</div>
      </div>
    </div>
  );
}
