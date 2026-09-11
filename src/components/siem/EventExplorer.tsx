"use client";
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSiemStore } from '@/store/useSiemStore';

export function EventExplorer() {
  const { events } = useSiemStore();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        No events generated yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold text-white">Event Explorer</h2>
        <div className="text-sm text-neutral-400">Total Events: {events.length.toLocaleString()}</div>
      </div>
      
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col min-h-0">
        {/* Header */}
        <div className="flex px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-wider shrink-0">
          <div className="w-16">ID</div>
          <div className="w-48">Timestamp</div>
          <div className="w-32">Severity</div>
          <div className="w-48">Event Type</div>
          <div className="w-32">Source IP</div>
          <div className="w-24">Action</div>
          <div className="flex-1">Threat Category</div>
        </div>

        {/* Virtualized Body */}
        <div 
          ref={parentRef} 
          className="flex-1 overflow-auto custom-scrollbar relative"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const event = events[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={`flex px-4 items-center text-sm border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors ${
                    virtualRow.index % 2 === 0 ? 'bg-neutral-900/20' : 'bg-transparent'
                  }`}
                >
                  <div className="w-16 text-neutral-500 font-mono text-xs">{event.id}</div>
                  <div className="w-48 text-neutral-400 font-mono text-xs">{new Date(event.timestamp).toLocaleString()}</div>
                  <div className="w-32">
                    <SeverityBadge severity={event.severity} />
                  </div>
                  <div className="w-48 text-neutral-300 truncate pr-4">{event.eventType}</div>
                  <div className="w-32 text-neutral-400 font-mono text-xs">{event.sourceIp}</div>
                  <div className="w-24 text-neutral-300">{event.action}</div>
                  <div className="flex-1 text-neutral-400 truncate">{event.threatCategory}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  let color = 'bg-neutral-800 text-neutral-400';
  if (severity === 'Critical') color = 'bg-red-900/50 text-red-400 border border-red-500/30';
  else if (severity === 'High') color = 'bg-amber-900/50 text-amber-400 border border-amber-500/30';
  else if (severity === 'Medium') color = 'bg-blue-900/50 text-blue-400 border border-blue-500/30';
  else if (severity === 'Low') color = 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/30';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${color}`}>
      {severity}
    </span>
  );
}
