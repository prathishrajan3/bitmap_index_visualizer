"use client";

import React, { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Search, Map, AlertTriangle, ShieldAlert, CheckSquare, Square, Building2, Globe2 } from 'lucide-react';
import { 
  executeCityQuery, 
  tryBuildCityQueryAST, 
  CITY_ISSUE_DEFINITIONS,
  CityIssueFilterState
} from '@/lib/city/cityQueries';
import { runRepeatedCityBenchmark } from '@/lib/city/cityStatistics';

export function CityIssueScanner() {
  const { 
    dataset, 
    bitmapIndex, 
    setActiveQuery, 
    setLastBenchmarkResult, 
    setSelectedDistrict, 
    selectedDistrict,
    issueFilters,
    setIssueFilters,
    scanScope,
    setScanScope,
    isScalingBenchmarkRunning
  } = useCityStore();

  const [isScanning, setIsScanning] = useState(false);

  // Extract available districts
  const districts = Array.from(new Set(dataset.map(d => d.district))).sort();
  
  // Default selected district if none is in store
  const currentDistrict = selectedDistrict || (districts.includes('Central Business District') ? 'Central Business District' : districts[0] || 'Central Business District');

  // Validate current query configuration
  const queryConfig = tryBuildCityQueryAST({
    district: currentDistrict,
    issues: issueFilters,
    isCityWide: scanScope === 'city'
  });

  const handleScan = async (cityWide: boolean) => {
    setIsScanning(true);
    const targetScope = cityWide ? 'city' : 'district';
    setScanScope(targetScope);
    
    // Tiny delay to let UI render the scanning state
    await new Promise(r => setTimeout(r, 40));
    
    try {
      const targetDistrict = cityWide ? null : currentDistrict;
      if (!cityWide) setSelectedDistrict(currentDistrict);
      
      const validation = tryBuildCityQueryAST({
        district: targetDistrict,
        issues: issueFilters,
        isCityWide: cityWide
      });

      if (!validation.isValid || !validation.ast) {
        console.warn("Cannot scan invalid query:", validation.error);
        return;
      }
      
      const ast = validation.ast;

      // Run benchmark on Nova City live dataset
      const benchmark = runRepeatedCityBenchmark(ast, dataset, bitmapIndex);
      setLastBenchmarkResult(benchmark);
      
      // Extract matching IDs for map highlighting
      const datasetIds = dataset.map(e => e.id);
      const bitmapRes = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
      const resultIds = new Set(bitmapRes.matchingIds);
      
      setActiveQuery(ast, resultIds);
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleAllIssues = (enableAll: boolean) => {
    setIssueFilters({
      traffic: enableAll,
      accident: enableAll,
      pollution: enableAll,
      power: enableAll,
      hospital: enableAll,
      risk: enableAll
    });
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      
      {/* Real-Life Context Banner */}
      <div className="bg-[#111115] border border-neutral-800 p-4 rounded-lg">
        <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Real-Life Use Case
        </h3>
        <p className="text-[11px] text-neutral-300 leading-relaxed italic">
          "Quickly determine whether a district or the city has critical problems such as severe traffic, accidents, pollution, power failures, or hospital overloads."
        </p>
      </div>

      {/* Target Scope & District Selection */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Target Scope</label>
          <div className="flex items-center bg-black/40 p-0.5 rounded border border-neutral-800 text-[10px]">
            <button
              onClick={() => setScanScope('district')}
              disabled={isScalingBenchmarkRunning}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                scanScope === 'district' 
                  ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Building2 className="w-3 h-3" /> District
            </button>
            <button
              onClick={() => setScanScope('city')}
              disabled={isScalingBenchmarkRunning}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                scanScope === 'city' 
                  ? 'bg-purple-600 text-white font-semibold shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe2 className="w-3 h-3" /> City-Wide
            </button>
          </div>
        </div>

        {scanScope === 'district' ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-neutral-500 font-medium">Select District:</label>
            <select 
              value={currentDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={isScalingBenchmarkRunning}
              className="bg-[#151518] border border-neutral-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500 w-full disabled:opacity-50 transition-colors"
            >
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        ) : (
          <div className="bg-purple-950/20 border border-purple-800/40 rounded-md p-2 text-[11px] text-purple-200 flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Scanning entire city across all districts.</span>
          </div>
        )}
      </div>

      {/* Issue Types to Detect */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            Issue Types to Detect ({queryConfig.selectedIssuesCount}/6)
          </label>
          <div className="flex items-center gap-2 text-[10px]">
            <button 
              onClick={() => toggleAllIssues(true)} 
              disabled={isScalingBenchmarkRunning}
              className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              All
            </button>
            <span className="text-neutral-600">•</span>
            <button 
              onClick={() => toggleAllIssues(false)} 
              disabled={isScalingBenchmarkRunning}
              className="text-neutral-400 hover:text-neutral-300 disabled:opacity-50"
            >
              None
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.traffic} 
              onChange={e => setIssueFilters({ traffic: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-amber-500 rounded" 
            /> 
            <span>Severe Traffic</span>
          </label>
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.accident} 
              onChange={e => setIssueFilters({ accident: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-red-500 rounded" 
            /> 
            <span>Accidents</span>
          </label>
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.pollution} 
              onChange={e => setIssueFilters({ pollution: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-purple-500 rounded" 
            /> 
            <span>High Pollution</span>
          </label>
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.power} 
              onChange={e => setIssueFilters({ power: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-yellow-500 rounded" 
            /> 
            <span>Power Failure</span>
          </label>
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.hospital} 
              onChange={e => setIssueFilters({ hospital: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-blue-500 rounded" 
            /> 
            <span>Hospital Overload</span>
          </label>
          <label className={`flex items-center gap-2 text-neutral-300 cursor-pointer select-none ${isScalingBenchmarkRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
              type="checkbox" 
              checked={issueFilters.risk} 
              onChange={e => setIssueFilters({ risk: e.target.checked })} 
              disabled={isScalingBenchmarkRunning}
              className="accent-rose-500 rounded" 
            /> 
            <span>Critical Risk</span>
          </label>
        </div>

        {/* Validation Warning if no issues selected */}
        {!queryConfig.isValid && (
          <div className="mt-1 p-2 rounded bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{queryConfig.error}</span>
          </div>
        )}

        {isScalingBenchmarkRunning && (
          <div className="mt-1 p-2 rounded bg-blue-950/30 border border-blue-800/40 text-[10px] text-blue-300 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
            <span>Scaling experiment is currently executing. Controls locked.</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        <button 
          onClick={() => handleScan(false)}
          disabled={isScanning || !queryConfig.isValid || isScalingBenchmarkRunning}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-blue-600 shadow-sm"
        >
          {isScanning && scanScope === 'district' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Check District
        </button>
        <button 
          onClick={() => handleScan(true)}
          disabled={isScanning || queryConfig.selectedIssuesCount === 0 || isScalingBenchmarkRunning}
          className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 border border-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 shadow-sm"
        >
          {isScanning && scanScope === 'city' ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Map className="w-4 h-4" />
          )}
          Scan City
        </button>
      </div>
      
    </div>
  );
}
