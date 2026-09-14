"use client";

import Link from 'next/link';
import { LayoutGrid, FlaskConical } from 'lucide-react';

export default function CityHeader() {
  return (
    <header className="h-16 border-b border-neutral-800/60 bg-[#070709] flex items-center justify-between px-6 shrink-0 z-50">
      {/* Branding */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <LayoutGrid className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="font-extrabold text-neutral-100 text-[15px] tracking-wide leading-tight">
            NOVA CITY <span className="font-normal text-neutral-400">DIGITAL TWIN</span>
          </h1>
          <p className="text-[10px] text-emerald-500/70 uppercase tracking-[0.2em] font-mono mt-0.5">
            SMART CITY ANALYTICS • BITMAP-POWERED
          </p>
        </div>
      </div>
      
      {/* Status & Actions */}
      <div className="flex items-center gap-6">
        {/* Status Chips */}
        <div className="hidden md:flex items-center gap-2 text-[10px] font-mono tracking-wider">
          <div className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            NOVA CITY
          </div>
          <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            LIVE
          </div>
          <div className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            2,000 ENTITIES
          </div>
          <div className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            BITMAP INDEX READY
          </div>
        </div>

        <div className="h-6 w-px bg-neutral-800"></div>

        <Link 
          href="/" 
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Return to Laboratory
        </Link>
      </div>
    </header>
  );
}
