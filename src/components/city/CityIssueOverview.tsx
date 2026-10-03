"use client";

import React, { useMemo } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { countSetBits } from '@/lib/bitmap/statistics';
import { bitmapAnd, bitmapOr } from '@/lib/bitmap/operations';

export function CityIssueOverview() {
  const { dataset, bitmapIndex } = useCityStore();

  const districtStats = useMemo(() => {
    if (!bitmapIndex.district || Object.keys(bitmapIndex.district).length === 0) return [];
    
    // We compute this using actual bitmap logic, not just dataset loops!
    // To find "issues" in a district:
    // issueBitmap = Severe Traffic OR Accident OR Hazardous OR Power Failure OR Hospital Critical
    
    // Get the base issue bitmaps
    const emptyBitmap = { bits: [], length: dataset.length, setBitCount: 0, density: 0, sourceColumn: '', sourceValue: '' };
    
    // Safe getters
    const getBmp = (col: string, val: string) => bitmapIndex[col]?.[val] || { bits: new Array(dataset.length).fill(0), length: dataset.length };

    const severeTraffic = getBmp('trafficLevel', 'Severe');
    const accidents = getBmp('incidentType', 'Accident');
    const hazardousAir = getBmp('airQuality', 'Hazardous');
    const powerFailure = getBmp('powerStatus', 'Failure');
    const hospitalCritical = getBmp('hospitalLoad', 'Critical');

    // Combine all issues into a single bitmap
    let issueBitmapBits = bitmapOr(severeTraffic.bits, accidents.bits);
    issueBitmapBits = bitmapOr(issueBitmapBits, hazardousAir.bits);
    issueBitmapBits = bitmapOr(issueBitmapBits, powerFailure.bits);
    issueBitmapBits = bitmapOr(issueBitmapBits, hospitalCritical.bits);

    const stats = [];

    for (const districtName of Object.keys(bitmapIndex.district)) {
      const districtBmp = bitmapIndex.district[districtName];
      
      // Compute intersection: district AND issue
      const districtIssuesBits = bitmapAnd(districtBmp.bits, issueBitmapBits);
      const totalIssues = countSetBits(districtIssuesBits);
      
      let status: 'CLEAR' | 'MONITOR' | 'ATTENTION' = 'CLEAR';
      if (totalIssues >= 10) status = 'ATTENTION';
      else if (totalIssues > 0) status = 'MONITOR';

      stats.push({ name: districtName, totalIssues, status });
    }

    return stats.sort((a, b) => b.totalIssues - a.totalIssues);
  }, [dataset.length, bitmapIndex]);

  return (
    <div className="p-4 border-b border-neutral-800/50 bg-[#0d0d0f]">
      <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-3 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5" /> City Issue Overview
      </h3>
      
      <div className="space-y-1">
        {districtStats.map((stat, idx) => (
          <div key={stat.name} className="flex items-center justify-between p-2 rounded bg-[#111115] border border-neutral-800/50 hover:bg-[#151518] transition-colors">
            <span className="text-xs text-neutral-300 truncate w-32" title={stat.name}>{stat.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-neutral-400">{stat.totalIssues} issues</span>
              {stat.status === 'ATTENTION' && <span className="text-[9px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 rounded uppercase">Attention</span>}
              {stat.status === 'MONITOR' && <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase">Monitor</span>}
              {stat.status === 'CLEAR' && <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded uppercase">Clear</span>}
            </div>
          </div>
        ))}
        {districtStats.length === 0 && (
          <div className="text-xs text-neutral-500 p-2 text-center">No data available</div>
        )}
      </div>
    </div>
  );
}
