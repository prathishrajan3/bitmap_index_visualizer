"use client";
import { useState } from 'react';
import { useSiemStore } from '@/store/useSiemStore';
import { parseSiemQuery } from '@/lib/siem/queryParser';
import { executeSiemQuery, ExecutionResult } from '@/lib/siem/queryExecutor';
import { Terminal, Play, AlertCircle, Sparkles } from 'lucide-react';
import { StrategyComparison } from './StrategyComparison';

export function SiemQueryBuilder() {
  const { bitmapIndex, rowCount, currentQuery, setCurrentQuery } = useSiemStore();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const handleExecute = () => {
    setError(null);
    setResult(null);
    try {
      const ast = parseSiemQuery(currentQuery);
      if (!ast) {
        setError("Query is empty.");
        return;
      }
      const execResult = executeSiemQuery(ast, bitmapIndex, rowCount);
      setResult(execResult);
    } catch (e: unknown) {
      const err = e as Error;
      setError(err.message);
    }
  };

  const loadExample = (q: string) => {
    setCurrentQuery(q);
    setError(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Top half: Builder */}
      <div className="flex gap-6 shrink-0">
        
        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col shadow-lg">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" /> Query Editor
          </h2>
          <textarea
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded p-4 font-mono text-sm text-blue-300 focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar mb-4"
            placeholder="severity = 'High' AND action = 'Block'"
          />
          <div className="flex justify-between items-center mt-auto">
            <div className="text-xs text-neutral-500">Supports: =, !=, IN, NOT IN, AND, OR, NOT, ()</div>
            <button
              onClick={handleExecute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold shadow flex items-center gap-2 transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" /> Execute Query
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-mono">{error}</span>
            </div>
          )}
        </div>

        <div className="w-80 bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col shrink-0">
           <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Examples</h3>
           <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
             <ExampleBtn q="severity = 'Critical'" onClick={loadExample} />
             <ExampleBtn q="severity = 'High'\nAND action = 'Block'" onClick={loadExample} />
             <ExampleBtn q="eventType IN ('Failed Login', 'Brute Force')\nAND authenticationResult = 'Failure'" onClick={loadExample} />
             <ExampleBtn q="protocol = 'SSH'\nAND severity IN ('High', 'Critical')" onClick={loadExample} />
             <ExampleBtn q="threatCategory = 'Malware'\nAND severity = 'Critical'" onClick={loadExample} />
           </div>
        </div>

      </div>

      {/* Bottom half: Results & Comparison */}
      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-6 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
        {result ? (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Execution Successful
                </h3>
                <p className="text-neutral-400 mt-1">Found <strong className="text-emerald-400">{result.metrics.matchingRows.toLocaleString()}</strong> matching events.</p>
              </div>
              <div className="text-xs text-neutral-500">
                Executed in {result.metrics.executionTimeMs.toFixed(2)}ms
              </div>
            </div>

            <StrategyComparison metrics={result.metrics} />

            <div className="mt-4 border border-neutral-800 rounded bg-neutral-950 p-4">
               <h4 className="text-sm font-bold text-neutral-300 mb-4">Why this query used these bitmaps:</h4>
               <div className="space-y-4">
                 {result.evaluationSteps.map((step, idx) => (
                   <div key={idx} className="flex flex-col gap-1 border-l-2 border-blue-900 pl-3">
                     <span className="text-xs font-mono text-neutral-500">Step {idx + 1}</span>
                     <span className="text-sm text-blue-300">{step.description}</span>
                     <span className="text-xs text-neutral-400">Produced vector with {step.resultBitmap.setBitCount} set bits.</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-600">
            Execute a query to see the execution strategy and results.
          </div>
        )}
      </div>

    </div>
  );
}

function ExampleBtn({ q, onClick }: { q: string, onClick: (q: string) => void }) {
  return (
    <button 
      onClick={() => onClick(q)}
      className="text-left bg-neutral-950 border border-neutral-800 hover:border-blue-500/50 p-3 rounded font-mono text-xs text-blue-400/80 hover:text-blue-400 transition-colors"
    >
      {q.split('\n').map((line, i) => <div key={i}>{line}</div>)}
    </button>
  );
}
