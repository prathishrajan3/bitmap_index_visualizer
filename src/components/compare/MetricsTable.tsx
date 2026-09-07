import React from 'react';
import { CompareMetrics } from '@/lib/compareEngine';

interface MetricsTableProps {
  metrics: CompareMetrics;
}

export function MetricsTable({ metrics }: MetricsTableProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-neutral-800/80 px-6 py-4 border-b border-neutral-700 font-bold text-white">
        Execution Comparison
      </div>
      <div className="flex-1 overflow-x-auto custom-scrollbar p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-neutral-400 border-b border-neutral-800">
              <th className="py-2 px-4 font-medium w-1/3">Metric</th>
              <th className="py-2 px-4 font-medium w-1/3">Table Scan</th>
              <th className="py-2 px-4 font-medium w-1/3">Bitmap Index</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50">
            <tr>
              <td className="py-3 px-4 text-neutral-300">Rows in dataset</td>
              <td className="py-3 px-4 font-mono">{metrics.totalRows}</td>
              <td className="py-3 px-4 font-mono">{metrics.totalRows}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Rows matching</td>
              <td className="py-3 px-4 font-mono text-emerald-400">{metrics.matchingRows}</td>
              <td className="py-3 px-4 font-mono text-emerald-400">{metrics.matchingRows}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Selectivity</td>
              <td className="py-3 px-4 font-mono">{(metrics.selectivity * 100).toFixed(1)}%</td>
              <td className="py-3 px-4 font-mono">{(metrics.selectivity * 100).toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Rows examined / fetched</td>
              <td className="py-3 px-4 font-mono text-red-400">{metrics.totalRows} (100%)</td>
              <td className="py-3 px-4 font-mono text-blue-400">{metrics.bitmapCandidateRows}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Predicate checks (logical)</td>
              <td className="py-3 px-4 font-mono">{metrics.tableScanPredicateChecks}</td>
              <td className="py-3 px-4 font-mono text-neutral-500">N/A</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Index lookups</td>
              <td className="py-3 px-4 font-mono text-neutral-500">N/A</td>
              <td className="py-3 px-4 font-mono">{metrics.bitmapVectorLookups}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-neutral-300">Bitmap operations</td>
              <td className="py-3 px-4 font-mono text-neutral-500">N/A</td>
              <td className="py-3 px-4 font-mono">{metrics.bitmapOperations}</td>
            </tr>
            <tr className="bg-neutral-950/50">
              <td className="py-4 px-4 text-neutral-300 font-bold border-t border-neutral-700">Conceptual Footprint*</td>
              <td className="py-4 px-4 font-mono font-bold text-red-400 border-t border-neutral-700">{metrics.tableScanConceptualFootprintBytes} bytes</td>
              <td className="py-4 px-4 font-mono font-bold text-emerald-400 border-t border-neutral-700">{metrics.bitmapConceptualFootprintBytes} bytes</td>
            </tr>
          </tbody>
        </table>

        {metrics.conceptualSavingsPct > 0 ? (
          <div className="mt-6 bg-emerald-900/10 border border-emerald-900/30 p-4 rounded text-sm text-emerald-400">
            <strong>Memory Savings:</strong> The bitmap strategy represents a {metrics.conceptualSavingsPct.toFixed(1)}% conceptual reduction in data evaluated before the heap fetch.
          </div>
        ) : (
          <div className="mt-6 bg-neutral-800/50 border border-neutral-700 p-4 rounded text-sm text-neutral-400">
            <strong>Note:</strong> In this specific scenario, the bitmap footprint is not smaller than scanning the table directly (e.g., table is extremely small or query forces full scan).
          </div>
        )}

        <div className="mt-4 text-xs text-neutral-500 italic">
          * Educational estimate: Table scan evaluates full row data. Bitmap evaluates only binary vectors. Actual PostgreSQL memory/disk footprint involves block headers, transaction IDs, alignment padding, and B-Tree metadata not modeled here.
        </div>
      </div>
    </div>
  );
}
