"use client";

import { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Play, Sparkles, AlertTriangle, Activity, Database, Clock, Zap } from 'lucide-react';
import { executeCityQuery, parseAICityQuery, CityExecutionResult } from '@/lib/city/cityQueries';
import { benchmarkCityQuery, CityBenchmarkComparison } from '@/lib/city/cityStatistics';
import { PRESET_QUERIES } from '@/lib/city/cityScenarios';
import { INDEXED_CITY_FIELDS } from '@/lib/city/cityBitmapEngine';
import CityMetrics from './CityMetrics';

export default function CitySidebar() {
  const { dataset, bitmapIndex, setActiveQuery, heatmapMode, setHeatmapMode } = useCityStore();
  const [nlQuery, setNlQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CityBenchmarkComparison | null>(null);

  const handleExecutePreset = (presetName: string) => {
    const ast = PRESET_QUERIES[presetName];
    if (!ast) return;
    executeAST(ast);
  };

  const handleExecuteNL = async () => {
    if (!nlQuery.trim()) return;
    setIsExecuting(true);
    setError(null);

    try {
      // Use existing generate-query endpoint but we need to ensure the backend supports "mode: 'city'".
      // Since we can't change the backend easily without knowing its exact code, 
      // we'll pass domain/mode in the prompt or request body.
      const response = await fetch('/api/generate-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: nlQuery, 
          domain: 'city',
          mode: 'city', // the user requested mode='city'
          allowedColumns: INDEXED_CITY_FIELDS
        }),
      });

      if (!response.ok) throw new Error('AI Engine failed to generate query');

      const data = await response.json();
      
      // We expect the AI to return a JSON object representing the AST.
      // E.g. { domain: "city", query: { operator: "AND", conditions: [...] } }
      // The parseAICityQuery function validates it thoroughly.
      const validFields = new Set(INDEXED_CITY_FIELDS as string[]);
      const ast = parseAICityQuery(data.query || data, validFields);
      
      executeAST(ast);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse AI response. Ensure it returns valid City Query AST.');
    } finally {
      setIsExecuting(false);
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
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-300 flex justify-between">
            <span>AI Natural Language</span>
            <span className="text-emerald-500/50">mode: city</span>
          </label>
          <div className="relative">
            <textarea 
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              placeholder="e.g. Find all critical hospitals with severe traffic nearby..."
              className="w-full bg-[#151518] border border-neutral-800 rounded-md p-3 text-sm focus:outline-none focus:border-emerald-500/50 resize-none h-24 text-neutral-200 placeholder:text-neutral-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteNL();
                }
              }}
            />
            <button 
              onClick={handleExecuteNL}
              disabled={isExecuting || !nlQuery.trim()}
              className="absolute bottom-3 right-3 p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
            >
              {isExecuting ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20 flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Preset Queries */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-300">Fast Scenario Queries</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(PRESET_QUERIES).map(preset => (
              <button
                key={preset}
                onClick={() => handleExecutePreset(preset)}
                className="px-2 py-2 bg-[#151518] hover:bg-neutral-800 border border-neutral-800 rounded-md text-xs text-left truncate transition-colors text-neutral-300 hover:text-emerald-400 flex items-center justify-between group"
              >
                <span className="truncate">{preset}</span>
                <Play className="w-3 h-3 opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap Controls */}
        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs font-semibold text-neutral-300">Map Heatmap Layer</label>
          <div className="flex gap-2">
            {['None', 'Traffic', 'Pollution', 'Risk'].map(mode => (
              <button
                key={mode}
                onClick={() => setHeatmapMode(mode as any)}
                className={`px-3 py-1.5 rounded-full text-xs transition-colors ${heatmapMode === mode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-transparent'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Results / Metrics Panel */}
        {lastResult && (
          <div className="mt-4 border-t border-neutral-800 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-200">Execution Results</h3>
              <button onClick={clearQuery} className="text-xs text-neutral-400 hover:text-white">Clear</button>
            </div>
            <CityMetrics benchmark={lastResult} />
          </div>
        )}

      </div>
    </div>
  );
}
