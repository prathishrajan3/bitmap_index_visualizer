"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings2, Database, Sparkles, Download, GitCompare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDataset, buildBitmapIndex, evaluatePredicate, type DatasetRow, type BitmapIndex, type Distribution } from '@/lib/bitmapEngine';

export default function LaboratoryDashboard() {
  // Configuration State
  const [rowCount, setRowCount] = useState(25);
  const [cardinality, setCardinality] = useState(3);
  const [distribution, setDistribution] = useState<Distribution>('Uniform');
  
  // Data State
  const [dataset, setDataset] = useState<DatasetRow[]>([]);
  const [index, setIndex] = useState<BitmapIndex>({});
  
  // Simulation State
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("Configure your experiment and click Generate Data.");
  const [aiLoading, setAiLoading] = useState(false);

  // Generate Data automatically on mount and config change
  useEffect(() => {
    handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, cardinality, distribution]);

  const handleGenerate = () => {
    const data = generateDataset(rowCount, cardinality, distribution);
    const bmpIndex = buildBitmapIndex(data);
    setDataset(data);
    setIndex(bmpIndex);
    setExplanation(`Generated ${rowCount} rows with ${cardinality} distinct values using a ${distribution} distribution.\n\nNotice how the density of 1s in the bitmap index changes as you adjust the cardinality and distribution. A high density often leads to better compression.`);
  };

  const askAi = async () => {
    setAiLoading(true);
    setExplanation("Thinking...");
    try {
      const res = await fetch('/api/ask-bitmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: { rowCount, cardinality, distribution },
          activeValue,
          activeRow
        })
      });
      const data = await res.json();
      setExplanation(data.explanation || "No explanation returned.");
    } catch (e) {
      setExplanation("Failed to connect to the AI Tutor. Please check your API keys.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500 w-6 h-6" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Bitmap Index Laboratory
          </h1>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <GitCompare className="w-4 h-4" /> Compare
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <Download className="w-4 h-4" /> Report
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/30 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-neutral-300 flex justify-between">
                  <span>Row Count</span>
                  <span className="text-blue-400 font-mono">{rowCount}</span>
                </label>
                <input 
                  type="range" min="5" max="100" value={rowCount} 
                  onChange={(e) => setRowCount(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1 text-neutral-300 flex justify-between">
                  <span>Cardinality</span>
                  <span className="text-blue-400 font-mono">{cardinality}</span>
                </label>
                <input 
                  type="range" min="2" max="10" value={cardinality} 
                  onChange={(e) => setCardinality(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-neutral-300">Distribution</label>
                <select 
                  value={distribution} 
                  onChange={(e) => setDistribution(e.target.value as Distribution)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Uniform">Uniform</option>
                  <option value="Random">Random</option>
                  <option value="Skewed">Skewed</option>
                </select>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium"
          >
            Regenerate Data
          </button>
        </aside>

        {/* Center: Visualization */}
        <main className="flex-1 p-6 overflow-y-auto bg-neutral-950">
          <div className="grid grid-cols-2 gap-8 h-full">
            
            {/* Table View */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50 flex flex-col min-h-[500px]">
              <div className="bg-neutral-800/80 px-4 py-2 border-b border-neutral-700 font-medium text-sm">
                Dataset Table
              </div>
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-neutral-400">
                      <th className="pb-2 font-medium border-b border-neutral-800">Row ID</th>
                      <th className="pb-2 font-medium border-b border-neutral-800">Value (e.g. Dept)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {dataset.map((row) => (
                        <motion.tr 
                          key={row.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`border-b border-neutral-800/50 cursor-pointer transition-colors
                            ${activeRow === row.id ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-neutral-800/50'}
                            ${activeValue && row.value !== activeValue ? 'opacity-30' : 'opacity-100'}
                          `}
                          onClick={() => {
                            setActiveRow(activeRow === row.id ? null : row.id);
                            setActiveValue(null);
                          }}
                        >
                          <td className="py-2 px-1 text-neutral-500">#{row.id}</td>
                          <td className="py-2 px-1">{row.value}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bitmap View */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50 flex flex-col min-h-[500px]">
              <div className="bg-neutral-800/80 px-4 py-2 border-b border-neutral-700 font-medium text-sm flex justify-between items-center">
                <span>Bitmap Index Arrays</span>
                <span className="text-xs text-neutral-500 font-normal">Click a bit to highlight row</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {Object.entries(index).map(([val, bits]) => (
                  <div key={val} className="space-y-2">
                    <div 
                      className="flex justify-between text-sm cursor-pointer hover:text-blue-400 transition-colors"
                      onClick={() => {
                        setActiveValue(activeValue === val ? null : val);
                        setActiveRow(null);
                      }}
                    >
                      <span className={`font-medium ${activeValue === val ? 'text-blue-400' : 'text-neutral-300'}`}>{val}</span>
                      <span className="text-neutral-500 text-xs font-mono">
                        Density: {Math.round((bits.filter(b=>b===1).length / bits.length) * 100)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bits.map((bit, idx) => {
                        const rowId = dataset[idx]?.id;
                        const isActive = activeRow === rowId || activeValue === val;
                        return (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveRow(activeRow === rowId ? null : rowId);
                              setActiveValue(null);
                            }}
                            className={`w-6 h-6 flex items-center justify-center text-xs rounded font-mono cursor-pointer transition-colors
                              ${bit === 1 
                                ? isActive ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-blue-500/40 text-blue-200' 
                                : isActive ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-800 text-neutral-600'
                              }
                            `}
                          >
                            {bit}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>

        {/* Right Sidebar: AI Tutor */}
        <aside className="w-80 border-l border-neutral-800 bg-neutral-900/30 p-6 flex flex-col shrink-0">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> AI Tutor
          </h2>
          
          <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm leading-relaxed text-neutral-300 relative overflow-y-auto whitespace-pre-wrap">
            {aiLoading ? (
              <div className="flex items-center gap-2 text-amber-500/70">
                <span className="animate-pulse">Analyzing bitmap operations...</span>
              </div>
            ) : (
              <p>{explanation}</p>
            )}
          </div>

          <button 
            onClick={askAi}
            disabled={aiLoading}
            className="mt-4 w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Ask the Bitmap
          </button>
        </aside>

      </div>
    </div>
  );
}
