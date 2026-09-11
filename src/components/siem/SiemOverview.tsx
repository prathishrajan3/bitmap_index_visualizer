"use client";
import { useSiemStore } from '@/store/useSiemStore';

export function SiemOverview() {
  const { events } = useSiemStore();

  const totalEvents = events.length;
  const criticalAlerts = events.filter(e => e.severity === 'Critical').length;
  const highSeverity = events.filter(e => e.severity === 'High').length;
  const failedLogins = events.filter(e => e.eventType === 'Failed Login').length;
  const blockedActions = events.filter(e => e.action === 'Block').length;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white mb-4">SOC Dashboard Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Total Events" value={totalEvents} color="text-blue-400" />
        <KpiCard title="Critical Alerts" value={criticalAlerts} color="text-red-500" />
        <KpiCard title="High Severity" value={highSeverity} color="text-amber-500" />
        <KpiCard title="Failed Logins" value={failedLogins} color="text-amber-400" />
        <KpiCard title="Blocked Actions" value={blockedActions} color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-4">Event Types</h3>
          <DistributionList 
            data={events} 
            field="eventType" 
            limit={5} 
          />
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase mb-4">Threat Categories</h3>
          <DistributionList 
            data={events.filter(e => e.threatCategory !== 'None')} 
            field="threatCategory" 
            limit={5} 
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, color }: { title: string, value: number, color: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col items-center justify-center text-center">
      <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">{title}</span>
      <span className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</span>
    </div>
  );
}

import { SecurityEvent } from '@/lib/siem/types';

function DistributionList({ data, field, limit }: { data: SecurityEvent[], field: keyof SecurityEvent, limit: number }) {
  const counts: Record<string, number> = {};
  data.forEach(item => {
    const val = String(item[field] || 'Unknown');
    counts[val] = (counts[val] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);

  return (
    <ul className="space-y-3">
      {sorted.map(([key, count]) => (
        <li key={key} className="flex justify-between items-center text-sm">
          <span className="text-neutral-300">{key}</span>
          <span className="text-neutral-500 font-mono">{count.toLocaleString()}</span>
        </li>
      ))}
      {sorted.length === 0 && <li className="text-neutral-600 text-sm italic">No data</li>}
    </ul>
  );
}
