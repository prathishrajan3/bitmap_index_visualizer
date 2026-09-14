"use client";

import Link from 'next/link';
import { LayoutGrid, FlaskConical } from 'lucide-react';

export default function CityHeader() {
  return (
    <header className="h-14 border-b border-neutral-800 bg-[#050505] flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-bold text-neutral-100 text-sm tracking-wide">NOVA CITY DIGITAL TWIN</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Powered by Bitmap Engine</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" /> Return to Laboratory
        </Link>
      </div>
    </header>
  );
}
