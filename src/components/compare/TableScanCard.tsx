import React from 'react';
import { Database, Search, ArrowDown, Activity, AlertCircle } from 'lucide-react';
import { CompareMetrics } from '@/lib/compareEngine';

interface TableScanCardProps {
  metrics: CompareMetrics;
}

export function TableScanCard({ metrics }: TableScanCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-neutral-800">
        <div className="p-3 bg-neutral-800/50 rounded-lg text-neutral-400">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Traditional Table Scan</h2>
          <p className="text-sm text-neutral-500">Check each table row against query predicates sequentially.</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {/* Pipeline Visualization */}
        <div className="bg-neutral-950 rounded-lg p-4 font-mono text-sm border border-neutral-800/50">
          <div className="text-neutral-500 mb-2 font-bold tracking-widest text-xs uppercase">Logical Execution Path</div>
          <div className="flex flex-col items-center text-neutral-400 gap-1">
            <div className="bg-neutral-800 px-4 py-1.5 rounded w-full text-center border border-neutral-700">Scan Table Rows (1 to {metrics.totalRows})</div>
            <ArrowDown className="w-4 h-4 text-neutral-600 my-1" />
            <div className="bg-neutral-800 px-4 py-1.5 rounded w-full text-center border border-neutral-700">Apply WHERE predicates</div>
            <ArrowDown className="w-4 h-4 text-neutral-600 my-1" />
            <div className="bg-emerald-900/20 text-emerald-400 px-4 py-1.5 rounded w-full text-center border border-emerald-900/50">Return {metrics.matchingRows} matching rows</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/50">
            <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Rows Examined</div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.totalRows} <span className="text-sm text-neutral-500">/ {metrics.totalRows}</span></div>
            <div className="text-xs text-neutral-500 mt-2">100% of table inspected</div>
          </div>
          
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800/50">
            <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Conceptual Work</div>
            <div className="text-2xl font-bold font-mono text-white">{metrics.tableScanPredicateChecks}</div>
            <div className="text-xs text-neutral-500 mt-2">logical predicate checks</div>
          </div>
        </div>

        <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-lg">
          <div className="flex gap-2 items-start text-amber-500">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Why this matters:</strong> Even if only {metrics.matchingRows} rows match, the engine must evaluate predicates for all {metrics.totalRows} rows. This becomes extremely expensive for large tables if no index is available.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
