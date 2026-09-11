"use client";
import { useSiemStore } from '@/store/useSiemStore';
import { BitmapMatrix } from '@/components/bitmap/BitmapMatrix';
import { Database, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

import { SecurityField } from '@/lib/siem/types';

export function BitmapIndexLab() {
  const { bitmapIndex, indexedFields } = useSiemStore();
  const [selectedField, setSelectedField] = useState<string | null>(indexedFields[0] || null);

  const availableFields = ['severity', 'eventType', 'action', 'protocol', 'country', 'threatCategory', 'authenticationResult', 'deviceType', 'username', 'sourcePort', 'destinationPort'];

  return (
    <div className="flex h-full gap-6">
      
      {/* Left sidebar: Fields */}
      <div className="w-64 flex flex-col gap-4 border-r border-neutral-800 pr-6 shrink-0">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" /> Index Fields
        </h2>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
          {availableFields.map(field => {
            const isIndexed = indexedFields.includes(field as SecurityField);
            return (
              <button
                key={field}
                onClick={() => isIndexed && setSelectedField(field)}
                className={`flex items-center justify-between p-3 rounded border text-sm transition-all text-left
                  ${selectedField === field ? 'bg-blue-900/30 border-blue-500/50' : 'bg-neutral-900 border-neutral-800'}
                  ${!isIndexed ? 'opacity-50 cursor-not-allowed' : 'hover:border-neutral-600 cursor-pointer'}
                `}
              >
                <span className="font-mono text-neutral-300">{field}</span>
                {isIndexed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-600 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
        
        <div className="bg-neutral-900 p-4 rounded text-xs text-neutral-400 mt-auto">
          Currently only categorical fields with low cardinality are pre-indexed for the SIEM simulation.
        </div>
      </div>

      {/* Right area: Bitmaps */}
      <div className="flex-1 flex flex-col min-h-0 bg-neutral-900 border border-neutral-800 rounded p-6">
        {selectedField && bitmapIndex[selectedField] ? (
          <>
            <h3 className="text-lg font-bold text-white mb-4 capitalize">{selectedField} Bitmaps</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
              {Object.entries(bitmapIndex[selectedField]).map(([val, bitmap]) => (
                <BitmapMatrix key={val} bitmap={bitmap} />
              ))}
            </div>
          </>
        ) : (
          <div className="m-auto text-neutral-500">
            {selectedField ? 'No index data found for this field. Generate data first.' : 'Select an indexed field to view its bitmaps.'}
          </div>
        )}
      </div>

    </div>
  );
}
