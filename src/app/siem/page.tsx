"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Activity, Search, Database, Terminal, ShieldAlert } from 'lucide-react';
import { useSiemStore } from '@/store/useSiemStore';

import { SiemOverview } from '@/components/siem/SiemOverview';
import { EventExplorer } from '@/components/siem/EventExplorer';
import { BitmapIndexLab } from '@/components/siem/BitmapIndexLab';
import { SiemQueryBuilder } from '@/components/siem/SiemQueryBuilder';
import { InvestigationPanel } from '@/components/siem/InvestigationPanel';

export default function SiemDashboard() {
  const { activeTab, setActiveTab, generateData, events } = useSiemStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      generateData(10000); // Default to 10k events
      initialized.current = true;
    }
  }, [generateData]);

  const navItems = [
    { id: 'Overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'Explorer', label: 'Event Explorer', icon: <Search className="w-4 h-4" /> },
    { id: 'IndexLab', label: 'Bitmap Index Lab', icon: <Database className="w-4 h-4" /> },
    { id: 'Query', label: 'Query Engine', icon: <Terminal className="w-4 h-4" /> },
    { id: 'Investigation', label: 'Investigation', icon: <ShieldAlert className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-emerald-500 w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold text-neutral-100">
              Cybersecurity SIEM Bitmap Query Engine
            </h1>
            <p className="text-xs text-neutral-400">Bitmap-Accelerated Security Event Analytics</p>
          </div>
          <div className="ml-4 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
            ● SIEM Engine Online
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors text-neutral-300">
            <ArrowLeft className="w-4 h-4" /> Bitmap Index Laboratory
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-neutral-800 bg-neutral-900/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-neutral-800">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Controls</div>
            <button 
              onClick={() => generateData(10000, Date.now())}
              className="w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            >
              Regenerate Events (10k)
            </button>
            <button 
              onClick={() => generateData(50000, Date.now())}
              className="w-full text-left px-3 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded transition-colors mt-2"
            >
              Regenerate Events (50k)
            </button>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <div className="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-2">Modules</div>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === item.id 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-neutral-500 text-center animate-pulse">
                <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">SIEM Engine Initializing</h2>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'Overview' && <SiemOverview />}
              {activeTab === 'Explorer' && <EventExplorer />}
              {activeTab === 'IndexLab' && <BitmapIndexLab />}
              {activeTab === 'Query' && <SiemQueryBuilder />}
              {activeTab === 'Investigation' && <InvestigationPanel />}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
