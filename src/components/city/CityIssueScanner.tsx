"use client";

import React, { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Search, Map, AlertTriangle, ShieldAlert } from 'lucide-react';
import { CityQueryNode } from '@/lib/city/cityTypes';
import { executeCityQuery } from '@/lib/city/cityQueries';
import { runRepeatedCityBenchmark } from '@/lib/city/cityStatistics';

export function CityIssueScanner() {
  const { dataset, bitmapIndex, setActiveQuery, setLastBenchmarkResult, setSelectedDistrict, selectedDistrict } = useCityStore();
  const [isScanning, setIsScanning] = useState(false);

  // Extract available districts
  const districts = Array.from(new Set(dataset.map(d => d.district))).sort();
  
  // Default selected district if none is in store
  const currentDistrict = selectedDistrict || (districts.includes('Central Business District') ? 'Central Business District' : districts[0]);

  const [conditions, setConditions] = useState({
    traffic: true,
    accident: true,
    pollution: true,
    power: true,
    hospital: true,
    risk: true
  });

  const buildIssueQuery = (forDistrict: string | null): CityQueryNode => {
    const orConditions: CityQueryNode[] = [];
    
    if (conditions.traffic) orConditions.push({ type: 'predicate', column: 'trafficLevel', operator: '=', value: 'Severe' });
    if (conditions.accident) orConditions.push({ type: 'predicate', column: 'incidentType', operator: '=', value: 'Accident' });
    if (conditions.pollution) orConditions.push({ type: 'predicate', column: 'airQuality', operator: '=', value: 'Hazardous' });
    if (conditions.power) orConditions.push({ type: 'predicate', column: 'powerStatus', operator: '=', value: 'Failure' });
    if (conditions.hospital) orConditions.push({ type: 'predicate', column: 'hospitalLoad', operator: '=', value: 'Critical' });
    if (conditions.risk) orConditions.push({ type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' });
    
    let issueNode: CityQueryNode;
    
    if (orConditions.length === 0) {
      // Fallback if user unchecks everything
      issueNode = { type: 'predicate', column: 'riskLevel', operator: '=', value: 'Critical' };
    } else if (orConditions.length === 1) {
      issueNode = orConditions[0];
    } else {
      // Build a tree of ORs
      let root = orConditions[0];
      for (let i = 1; i < orConditions.length; i++) {
        root = { type: 'logical', operator: 'OR', left: root, right: orConditions[i] };
      }
      issueNode = root;
    }

    if (!forDistrict) return issueNode; // City-wide scan

    return {
      type: 'logical',
      operator: 'AND',
      left: { type: 'predicate', column: 'district', operator: '=', value: forDistrict },
      right: issueNode
    };
  };

  const handleScan = async (cityWide: boolean) => {
    setIsScanning(true);
    
    // Tiny delay to let UI render the scanning state
    await new Promise(r => setTimeout(r, 50));
    
    try {
      const targetDistrict = cityWide ? null : currentDistrict;
      if (!cityWide) setSelectedDistrict(currentDistrict);
      
      const ast = buildIssueQuery(targetDistrict);
      
      // Run benchmark
      const benchmark = runRepeatedCityBenchmark(ast, dataset, bitmapIndex);
      setLastBenchmarkResult(benchmark);
      
      // We need matching IDs for the map highlighting
      // The benchmark already extracted this from the last run, but let's re-run executeCityQuery to get the exact result object for activeQuery
      const datasetIds = dataset.map(e => e.id);
      const bitmapRes = executeCityQuery(ast, bitmapIndex, dataset.length, datasetIds);
      const resultIds = new Set(bitmapRes.matchingIds);
      
      setActiveQuery(ast, resultIds);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-5">
      <div className="bg-[#111115] border border-neutral-800 p-4 rounded-lg">
        <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-2">Real-Life Use Case</h3>
        <p className="text-[11px] text-neutral-300 leading-relaxed italic">
          "Quickly determine whether a district or the city has critical problems such as severe traffic, accidents, pollution, power failures, or hospital overloads."
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">District Selection</label>
        <select 
          value={currentDistrict}
          onChange={(e) => {
            setSelectedDistrict(e.target.value);
            // Optionally, we could auto-scan here, but manual button is better for benchmarking
          }}
          className="bg-[#151518] border border-neutral-800 rounded-md p-2 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
        >
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-1">Issue Types to Detect</label>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.traffic} onChange={e => setConditions(s => ({...s, traffic: e.target.checked}))} className="accent-amber-500" /> Severe Traffic
          </label>
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.accident} onChange={e => setConditions(s => ({...s, accident: e.target.checked}))} className="accent-red-500" /> Accidents
          </label>
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.pollution} onChange={e => setConditions(s => ({...s, pollution: e.target.checked}))} className="accent-purple-500" /> High Pollution
          </label>
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.power} onChange={e => setConditions(s => ({...s, power: e.target.checked}))} className="accent-yellow-500" /> Power Failure
          </label>
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.hospital} onChange={e => setConditions(s => ({...s, hospital: e.target.checked}))} className="accent-blue-500" /> Hospital Overload
          </label>
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input type="checkbox" checked={conditions.risk} onChange={e => setConditions(s => ({...s, risk: e.target.checked}))} className="accent-rose-500" /> Critical Risk
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <button 
          onClick={() => handleScan(false)}
          disabled={isScanning}
          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isScanning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
          Check District
        </button>
        <button 
          onClick={() => handleScan(true)}
          disabled={isScanning}
          className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2 border border-neutral-700 disabled:opacity-50"
        >
          <Map className="w-4 h-4" /> Scan City
        </button>
      </div>
      
    </div>
  );
}
