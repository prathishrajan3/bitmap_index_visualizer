import React from 'react';
import { DatasetRow } from '@/lib/bitmap/types';
import { CompareMetrics } from '@/lib/compareEngine';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface RowExplorerProps {
  dataset: DatasetRow[];
  metrics: CompareMetrics;
  vectorsUsed: {col: string, val: string, bits: number[]}[];
  finalBits: number[];
}

export function RowExplorer({ dataset, metrics, vectorsUsed, finalBits }: RowExplorerProps) {
  // If no vectors were used, we just show Table Scan matches
  const hasVectors = vectorsUsed.length > 0;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden h-full flex flex-col">
      <div className="bg-neutral-800/80 px-6 py-4 border-b border-neutral-700 flex justify-between items-center">
        <h3 className="font-bold text-white">Explore Row-by-Row Execution</h3>
        <span className="text-xs text-neutral-400">First 50 rows shown</span>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar p-0">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-neutral-900 sticky top-0 z-10 shadow-md">
            <tr className="text-neutral-400 border-b border-neutral-800">
              <th className="py-2 px-4 font-medium border-r border-neutral-800/50">Row ID</th>
              
              {/* Data Columns for the predicates */}
              {vectorsUsed.map((v, i) => (
                <th key={`data-${i}`} className="py-2 px-4 font-medium border-r border-neutral-800/50 text-blue-300">
                  {v.col}
                </th>
              ))}

              {/* Table Scan State */}
              <th className="py-2 px-4 font-medium border-r border-neutral-800/50 text-neutral-300">
                Table Scan
              </th>

              {/* Bitmap Vectors */}
              {vectorsUsed.map((v, i) => (
                <th key={`vec-${i}`} className="py-2 px-4 font-medium border-r border-neutral-800/50 text-blue-400">
                  V{i+1}: {v.val}
                </th>
              ))}

              {/* Final Bitmap Result */}
              {hasVectors && (
                <th className="py-2 px-4 font-medium border-r border-neutral-800/50 text-emerald-400">
                  Final AND
                </th>
              )}

              <th className="py-2 px-4 font-medium">Selected?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/30">
            {dataset.slice(0, 50).map((row, i) => {
              const isMatched = metrics.tableScanRowIds.includes(row.id);
              
              return (
                <tr key={row.id} className={isMatched ? 'bg-emerald-900/10' : 'hover:bg-neutral-800/20'}>
                  <td className="py-2 px-4 border-r border-neutral-800/50 font-mono text-xs text-neutral-500">#{row.id}</td>
                  
                  {vectorsUsed.map((v, idx) => (
                    <td key={`data-${idx}`} className="py-2 px-4 border-r border-neutral-800/50">
                      {String(row[v.col])}
                    </td>
                  ))}

                  <td className="py-2 px-4 border-r border-neutral-800/50 text-xs">
                    <span className="text-neutral-500 line-through mr-1">Scanned</span>
                  </td>

                  {vectorsUsed.map((v, idx) => {
                    const bit = v.bits[i];
                    return (
                      <td key={`vec-${idx}`} className={`py-2 px-4 border-r border-neutral-800/50 font-mono ${bit === 1 ? 'text-emerald-400 font-bold' : 'text-neutral-600'}`}>
                        {bit}
                      </td>
                    );
                  })}

                  {hasVectors && (
                    <td className={`py-2 px-4 border-r border-neutral-800/50 font-mono ${finalBits[i] === 1 ? 'text-emerald-400 font-bold' : 'text-neutral-600'}`}>
                      {finalBits[i]}
                    </td>
                  )}

                  <td className="py-2 px-4">
                    {isMatched ? (
                      <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> YES
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-400/50 text-xs">
                        <XCircle className="w-4 h-4" /> NO
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {!metrics.resultSetsEqual && (
        <div className="bg-red-900/20 text-red-400 p-4 border-t border-red-900/50 text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Result mismatch detected between Table Scan and Bitmap Index!
        </div>
      )}
    </div>
  );
}
