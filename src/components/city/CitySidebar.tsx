"use client";

import { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Play, Sparkles, AlertTriangle, Activity, Database, Clock, Zap } from 'lucide-react';
import { executeCityQuery, parseAICityQuery, CityExecutionResult } from '@/lib/city/cityQueries';
import { benchmarkCityQuery, CityBenchmarkComparison } from '@/lib/city/cityStatistics';
import { PRESET_QUERIES } from '@/lib/city/cityScenarios';
import { INDEXED_CITY_FIELDS } from '@/lib/city/cityBitmapEngine';
import CityMetrics from './CityMetrics';
import BitmapQueryVisualizer from './BitmapQueryVisualizer';
import CityTooltip from './ui/CityTooltip';

export default function CitySidebar() {
  const { dataset, bitmapIndex, setActiveQuery, heatmapMode, setHeatmapMode } = useCityStore();
  const [nlQuery, setNlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGeneratingQuery, setIsGeneratingQuery] = useState(false);
  const [executionStage, setExecutionStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CityBenchmarkComparison | null>(null);

  const handleExecutePreset = (presetName: string) => {
    const ast = PRESET_QUERIES[presetName];
    if (!ast) return;
    executeAST(ast);
  };

  const handleGenerateSmartQuery = async () => {
    setIsGeneratingQuery(true);
    setError(null);
    try {
      // Basic frequency counting
      const stats: Record<string, Record<string, number>> = {
        entityType: {},
        trafficLevel: {},
        district: {},
        riskLevel: {}
      };
      
      dataset.forEach(entity => {
        stats.entityType[entity.entityType] = (stats.entityType[entity.entityType] || 0) + 1;
        stats.trafficLevel[entity.trafficLevel] = (stats.trafficLevel[entity.trafficLevel] || 0) + 1;
        stats.district[entity.district] = (stats.district[entity.district] || 0) + 1;
        stats.riskLevel[entity.riskLevel] = (stats.riskLevel[entity.riskLevel] || 0) + 1;
      });

      // Find top 2 for each
      const summary: Record<string, string[]> = {};
      for (const [key, counts] of Object.entries(stats)) {
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        summary[key] = sorted.slice(0, 2).map(([val, count]) => `${val} (${count})`);
      }

      const response = await fetch('/api/suggest-city-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary })
      });

      if (!response.ok) throw new Error('Failed to generate query');
      
      const data = await response.json();
      setNlQuery(data.query || '');
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate smart query.");
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const handleExecuteNL = async () => {
    if (!nlQuery.trim()) return;
    setIsExecuting(true);
    setError(null);
    setExecutionStage('Understanding question...');

    try {
      await delay(400); // small delay to make the first state visible
      setExecutionStage('Building Bitmap query...');
      
      // Extract unique values to force the LLM to use exact enums (e.g. "Road" instead of "roads")
      const allowedValues: Record<string, string[]> = {};
      INDEXED_CITY_FIELDS.forEach(col => {
        const unique = new Set(dataset.map((d: any) => String(d[col])));
        allowedValues[col] = Array.from(unique);
      });

      const response = await fetch('/api/generate-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: nlQuery, 
          domain: 'city',
          mode: 'city',
          allowedColumns: INDEXED_CITY_FIELDS,
          allowedValues
        }),
      });

      if (!response.ok) throw new Error('AI Engine failed to generate query');

      const data = await response.json();
      const validFields = new Set(INDEXED_CITY_FIELDS as string[]);
      const ast = parseAICityQuery(data.query || data, validFields);
      
      setExecutionStage('Executing...');
      await delay(300); // small delay for visual feedback

      executeAST(ast);

    } catch (err: any) {
      console.error(err);
      setError("I COULDN'T INTERPRET THAT QUERY. Try: 'Find severe traffic areas'");
    } finally {
      setIsExecuting(false);
      setExecutionStage('');
    }
  };

  const executeAST = (ast: any) => {
    try {
      const datasetIds = dataset.map(e => e.id);
      // Run bitmap engine
      const bitmapRes = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
      
      // Run benchmark
      const benchmark = benchmarkCityQuery(ast, dataset, bitmapRes);
      
      const resultIds = new Set(bitmapRes.matchingIds);
      
      setActiveQuery(ast, resultIds);
      setLastResult(benchmark);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Execution error');
    }
  };

  const clearQuery = () => {
    setActiveQuery(null, new Set());
    setLastResult(null);
    setNlQuery('');
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0f] border-l border-neutral-800 text-sm">
      <div className="p-4 border-b border-neutral-800">
        <h2 className="font-semibold flex items-center gap-2 text-emerald-400">
          <Database className="w-4 h-4" />
          City Query Engine
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Execute Boolean logic against {dataset.length.toLocaleString()} entities.
        </p>
      </div>

      <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
        
        {/* Natural Language Input */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
              1. Ask the City
            </label>
            <CityTooltip content="The AI will translate your natural language question into a structured Bitmap query.">
              <span className="w-4 h-4 rounded-full border border-neutral-700 text-neutral-500 flex items-center justify-center text-[10px] cursor-help">?</span>
            </CityTooltip>
          </div>
          <p className="text-xs text-neutral-500 leading-snug">
            Describe what you want to find in natural language.
          </p>
          <div className="relative">
            <textarea 
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="Example: Find all critical hospitals with severe traffic nearby..."
              className="w-full bg-[#151518] border border-neutral-800 rounded-md p-3 text-sm focus:outline-none focus:border-emerald-500/50 resize-none h-24 text-neutral-200 placeholder:text-neutral-600 shadow-inner"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteNL();
                }
              }}
            />
          </div>
          
          <button 
            onClick={handleExecuteNL}
            disabled={isExecuting || !nlQuery.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase">{executionStage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Analyze City</span>
              </>
            )}
          </button>

          <button 
            onClick={handleGenerateSmartQuery}
            disabled={isGeneratingQuery || isExecuting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700 hover:text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isGeneratingQuery ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase">Thinking...</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Generate Smart Query</span>
              </>
            )}
          </button>
          
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 p-3 rounded border border-red-400/20 flex gap-2 items-start mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Quick Analysis */}
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-neutral-800/50">
          <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            2. Quick Analysis
          </label>
          <p className="text-xs text-neutral-500 mb-1 leading-snug">Explore common city conditions instantly.</p>
          <div className="grid grid-cols-1 gap-2">
            {Object.keys(PRESET_QUERIES).map(preset => (
              <button
                key={preset}
                onClick={() => handleExecutePreset(preset)}
                className="p-2.5 bg-[#151518] hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/30 rounded-md text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-emerald-400">{preset}</span>
                  <span className="text-[10px] text-neutral-500">{
                    preset === 'Traffic Hotspots' ? 'Find severe congestion' :
                    preset === 'Pollution Hotspots' ? 'Find poor air quality' :
                    preset === 'Accident Zones' ? 'Active incidents' :
                    preset === 'Emergency Zones' ? 'Critical risk areas' :
                    preset === 'Hospital Overload' ? 'Critical capacity' :
                    preset === 'Power Failures' ? 'Offline substations' : 'Multiple simultaneous conditions'
                  }</span>
                </div>
                <Play className="w-4 h-4 text-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Controls */}
        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-neutral-800/50">
          <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            3. Map Layer
          </label>
          <p className="text-xs text-neutral-500 mb-1 leading-snug">Choose what the city map should emphasize.</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'None', label: 'Overview', desc: 'Default city view' },
              { id: 'Traffic', label: 'Traffic', desc: 'Visualize traffic severity' },
              { id: 'Pollution', label: 'Air Quality', desc: 'Visualize pollution conditions' },
              { id: 'Risk', label: 'Risk', desc: 'Visualize emergency risk' }
            ].map(mode => (
              <CityTooltip key={mode.id} content={mode.desc}>
                <button
                  onClick={() => setHeatmapMode(mode.id as any)}
                  className={`w-full py-2 rounded-md text-xs font-medium transition-colors border ${heatmapMode === mode.id ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-[#151518] text-neutral-400 hover:bg-neutral-800 border-neutral-800 hover:text-neutral-300'}`}
                >
                  {mode.label}
                </button>
              </CityTooltip>
            ))}
          </div>
        </div>

        {/* Results / Visualizer / Metrics Panel */}
        <div className="mt-4 pt-4 border-t border-neutral-800/50 pb-8">
          {lastResult ? (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
                  4. Query Result
                </label>
                <button onClick={clearQuery} className="text-[10px] uppercase tracking-wider text-neutral-500 hover:text-white transition-colors">Clear</button>
              </div>
              
              <CityMetrics benchmark={lastResult} />
              
              <div className="mt-2">
                <label className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase mb-3 block">
                  5. How the Query was Executed
                </label>
                <BitmapQueryVisualizer />
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center text-center bg-[#111115] border border-dashed border-neutral-800 rounded-lg h-48">
              <div className="w-10 h-10 rounded-full bg-neutral-800/50 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-neutral-500" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-300">NO QUERY RUN</h3>
              <p className="text-xs text-neutral-500 mt-2 max-w-[200px]">
                Ask the city a question or choose a quick analysis to see results.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
