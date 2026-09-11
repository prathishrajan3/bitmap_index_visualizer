import { ExecutionMetrics } from '@/lib/siem/queryExecutor';
import { Database, Zap } from 'lucide-react';

export function StrategyComparison({ metrics }: { metrics: ExecutionMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
      
      {/* Table Scan Column */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
        <h4 className="text-sm font-bold text-neutral-400 uppercase flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-neutral-500" /> Conventional Table Scan
        </h4>
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between border-b border-neutral-800/50 pb-2">
            <span className="text-neutral-500">Rows Scanned</span>
            <span className="text-neutral-300 font-mono">{metrics.rowsScanned.toLocaleString()}</span>
          </li>
          <li className="flex justify-between border-b border-neutral-800/50 pb-2">
            <span className="text-neutral-500">Predicate Checks</span>
            <span className="text-neutral-300 font-mono">~{metrics.tableScanChecks.toLocaleString()}</span>
          </li>
          <li className="flex justify-between pt-1">
            <span className="text-neutral-500">Matches Found</span>
            <span className="text-neutral-300 font-mono">{metrics.matchingRows.toLocaleString()}</span>
          </li>
        </ul>
      </div>

      {/* Bitmap Engine Column */}
      <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Zap className="w-24 h-24" />
        </div>
        <h4 className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2 mb-4 relative z-10">
          <Zap className="w-4 h-4" /> Bitmap Engine
        </h4>
        <ul className="space-y-3 text-sm relative z-10">
          <li className="flex justify-between border-b border-blue-900/30 pb-2">
            <span className="text-blue-300/70">Bitmap Vectors Used</span>
            <span className="text-blue-300 font-mono">{metrics.bitmapVectorsUsed}</span>
          </li>
          <li className="flex justify-between border-b border-blue-900/30 pb-2">
            <span className="text-blue-300/70">Bitwise Operations</span>
            <span className="text-blue-300 font-mono">{metrics.operationsPerformed.length > 0 ? metrics.operationsPerformed.join(', ') : 'None'}</span>
          </li>
          <li className="flex justify-between pt-1">
            <span className="text-blue-300/70">Matches Materialized</span>
            <span className="text-emerald-400 font-mono">{metrics.matchingRows.toLocaleString()}</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
