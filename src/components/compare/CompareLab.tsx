import React, { useState, useEffect } from 'react';
import { GitCompare, BookOpen } from 'lucide-react';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { calculateMetrics, parsePredicates, CompareMetrics } from '@/lib/compareEngine';
import { TableScanCard } from './TableScanCard';
import { BitmapIndexCard } from './BitmapIndexCard';
import { MetricsTable } from './MetricsTable';
import { RowExplorer } from './RowExplorer';

interface CompareLabProps {
  sqlQuery: string;
  onNavigate: (tab: string) => void;
}

export function CompareLab({ sqlQuery, onNavigate }: CompareLabProps) {
  const { dataset, schema, bitmapIndex } = useLaboratoryStore();
  const [metrics, setMetrics] = useState<CompareMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'explorer'>('cards');

  useEffect(() => {
    // Recalculate metrics whenever the query, dataset, or index changes
    if (dataset.length > 0) {
      try {
        const m = calculateMetrics(dataset, bitmapIndex, sqlQuery, schema.columns.length);
        setMetrics(m);
      } catch (e) {
        console.error("Failed to calculate metrics", e);
        setMetrics(null);
      }
    }
  }, [sqlQuery, dataset, bitmapIndex, schema.columns.length]);

  if (!metrics) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
        <GitCompare className="w-12 h-12 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-neutral-400 mb-2">No Comparison Data</h2>
        <p className="max-w-md">
          Please ensure you have generated a dataset and executed a query with a WHERE clause in the Neon Query tab.
        </p>
      </div>
    );
  }

  const parsed = parsePredicates(sqlQuery);
  const { vectorsUsed, finalBits } = require('@/lib/compareEngine').evaluateBitmapIndex(dataset, bitmapIndex, parsed);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-amber-500" /> 
            Execution Strategy Comparison
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Analyzing the active query: <span className="font-mono text-blue-300 ml-1 bg-neutral-900 px-2 py-0.5 rounded">{sqlQuery || 'SELECT * FROM DatasetRow'}</span>
          </p>
        </div>
        
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
          <button 
            onClick={() => setViewMode('cards')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'cards' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-300'}`}
          >
            Visual Pipeline
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-300'}`}
          >
            Detailed Metrics
          </button>
          <button 
            onClick={() => setViewMode('explorer')}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'explorer' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-neutral-300'}`}
          >
            Row Explorer
          </button>
        </div>
      </div>

      {parsed.predicates.length === 0 && (
        <div className="mb-6 bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg text-sm text-blue-300 flex items-center gap-3 shrink-0">
          <BookOpen className="w-5 h-5 shrink-0" />
          <div>
            <strong>No WHERE clause detected.</strong> Since this query requests all rows, a Table Scan is the optimal strategy. Bitmap Indexes are used to filter rows based on predicates. Try generating a query with conditions in the Neon Query tab!
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {viewMode === 'cards' && (
          <div className="grid grid-cols-2 gap-6 h-full overflow-y-auto custom-scrollbar pb-6">
            <TableScanCard metrics={metrics} />
            <BitmapIndexCard metrics={metrics} vectorsUsed={vectorsUsed} finalBits={finalBits} logic={parsed.logic} />
          </div>
        )}

        {viewMode === 'table' && (
          <MetricsTable metrics={metrics} />
        )}

        {viewMode === 'explorer' && (
          <RowExplorer dataset={dataset} metrics={metrics} vectorsUsed={vectorsUsed} finalBits={finalBits} />
        )}
      </div>
    </div>
  );
}
