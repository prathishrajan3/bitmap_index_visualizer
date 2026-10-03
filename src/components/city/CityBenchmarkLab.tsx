"use client";

import React, { useState } from 'react';
import { useCityStore } from '@/store/useCityStore';
import { Activity, ShieldAlert, Cpu, Zap, Database, BarChart3, Clock, CheckCircle2, Copy } from 'lucide-react';
import { CityQueryNode } from '@/lib/city/cityTypes';

export function CityBenchmarkLab() {
  const { lastBenchmarkResult, activeQuery, dataset } = useCityStore();
  
  if (!lastBenchmarkResult) {
    return (
      <div className="p-6 text-center text-neutral-500">
        <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Run a query in the Issue Scanner to see performance evidence.</p>
      </div>
    );
  }

  const {
    totalRows,
    matchingRows,
    tableScanRowsScanned,
    tableScanPredicateChecks,
    bitmapVectorsUsed,
    bitmapOperations,
    bitmapCandidateRows,
    rowsAvoided,
    rowReductionPct,
    tableScanMedianMs,
    bitmapMedianMs,
    speedup,
    resultSetsEqual
  } = lastBenchmarkResult;

  const copyToClipboard = () => {
    const text = `
Nova City Bitmap Index Demonstration
Dataset: ${totalRows} entities

Table Scan:
Rows scanned: ${tableScanRowsScanned}
Predicate checks: ${tableScanPredicateChecks}

Bitmap Index:
Vectors used: ${bitmapVectorsUsed}
Boolean operations: ${bitmapOperations}
Candidates: ${bitmapCandidateRows}

Rows avoided: ${rowsAvoided}
Result sets identical: ${resultSetsEqual ? 'YES' : 'NO'}
Median Table Scan: ${tableScanMedianMs.toFixed(2)} ms
Median Bitmap: ${bitmapMedianMs.toFixed(2)} ms
Observed speedup: ${speedup ? speedup.toFixed(2) + 'x' : 'N/A'}
`.trim();
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 flex flex-col gap-6 overflow-y-auto">
      
      {/* WHAT THIS DEMO PROVES */}
      <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-4">
        <h3 className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase mb-3 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5" /> What This Demo Proves
        </h3>
        <ul className="text-xs text-neutral-300 space-y-2 list-disc pl-4">
          <li>The same city query can be executed using two retrieval strategies.</li>
          <li>Conventional approach checks city entities row by row.</li>
          <li>Bitmap approach uses indexed categorical vectors and Boolean operations.</li>
          <li>Both approaches are validated against the exact same result set.</li>
          <li>The system shows how many irrelevant rows can be filtered before entity retrieval.</li>
        </ul>
      </div>

      {/* VALIDATION */}
      <div className={`p-4 rounded-lg border ${resultSetsEqual ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1">Result Correctness</div>
            <div className={`text-sm font-bold ${resultSetsEqual ? 'text-emerald-400' : 'text-red-400'} flex items-center gap-2`}>
              {resultSetsEqual ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {resultSetsEqual ? 'IDENTICAL RESULT SET ✓' : 'VALIDATION FAILED'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-mono text-white">{matchingRows}</div>
            <div className="text-[10px] text-neutral-500 uppercase">Matches Found</div>
          </div>
        </div>
      </div>

      {/* EVIDENCE CARDS */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Query Performance Evidence</h3>
        
        {/* TABLE SCAN CARD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-neutral-800/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <h4 className="text-xs font-bold text-neutral-300 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" /> Conventional Table Scan
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl font-mono text-white">{tableScanRowsScanned.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500 uppercase mt-0.5">Rows Scanned</div>
            </div>
            <div>
              <div className="text-xl font-mono text-white">{tableScanPredicateChecks.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500 uppercase mt-0.5">Predicate Checks</div>
            </div>
            <div className="col-span-2">
              <div className="text-xl font-mono text-amber-400 flex items-end gap-1">
                {tableScanMedianMs.toFixed(2)} <span className="text-xs mb-1 text-amber-400/50">ms median</span>
              </div>
            </div>
          </div>
        </div>

        {/* BITMAP CARD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-900/20 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
          <h4 className="text-xs font-bold text-neutral-300 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" /> Bitmap Index Retrieval
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xl font-mono text-white">{bitmapVectorsUsed.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500 uppercase mt-0.5">Vectors Used</div>
            </div>
            <div>
              <div className="text-xl font-mono text-white">{bitmapOperations.toLocaleString()}</div>
              <div className="text-[10px] text-neutral-500 uppercase mt-0.5">Boolean Operations</div>
            </div>
            <div className="col-span-2">
              <div className="text-xl font-mono text-blue-400 flex items-end gap-1">
                {bitmapMedianMs.toFixed(2)} <span className="text-xs mb-1 text-blue-400/50">ms median</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WORK AVOIDED */}
      <div className="bg-[#111115] border border-neutral-800 rounded-lg p-4">
        <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-4 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Work Reduction
        </h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-mono text-emerald-400">{rowsAvoided.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-500 uppercase">Irrelevant Rows Avoided</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-emerald-400">{rowReductionPct.toFixed(1)}%</div>
            <div className="text-[10px] text-neutral-500 uppercase">Filtered Before Materialization</div>
          </div>
        </div>
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          Row-level filtering is performed on compact bitmap representations before matching rows are materialized.
        </p>
      </div>

      <button 
        onClick={copyToClipboard}
        className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
      >
        <Copy className="w-3.5 h-3.5" /> Copy Benchmark Summary
      </button>

      {/* METHODOLOGY EXPLANATION */}
      <div className="mt-4 pt-4 border-t border-neutral-800/50">
        <h3 className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase mb-3">Benchmark Methodology</h3>
        <p className="text-[10px] text-neutral-500 leading-relaxed space-y-2">
          <span className="block mb-1">• <strong>Dataset:</strong> {totalRows} synthetic smart city entities.</span>
          <span className="block mb-1">• <strong>Timing:</strong> 5 warmup iterations, 15 measured alternating iterations.</span>
          <span className="block text-amber-500/70 mt-2 italic">
            Note: This is an educational in-browser benchmark using synthetic city data. It demonstrates the retrieval strategy and relative workload reduction; it is not a production database performance benchmark.
          </span>
        </p>
      </div>

    </div>
  );
}
