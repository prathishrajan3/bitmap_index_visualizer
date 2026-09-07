"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings2, Database, Sparkles, Download, GitCompare, Upload, Search, Terminal, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { buildDatasetBitmapIndex } from '@/lib/bitmap';

export default function LaboratoryDashboard() {
  const { 
    rowCount, seed, schema, dataset, bitmapIndex, 
    setRowCount, setSeed, updateColumnDef, generateData 
  } = useLaboratoryStore();
  
  // Local UI State
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeValue, setActiveValue] = useState<{col: string, val: string} | null>(null);
  const [explanation, setExplanation] = useState<string>("Configure your experiment and click Generate Data.");
  const [aiLoading, setAiLoading] = useState(false);

  // Advanced Database State
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [sqlPrompt, setSqlPrompt] = useState<string>("");
  const [queryExecuting, setQueryExecuting] = useState(false);
  const [queryResultMsg, setQueryResultMsg] = useState<string>("");
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Data automatically on mount and config change
  useEffect(() => {
    generateData();
    setExplanation(`Generated ${rowCount} rows using Seed ${seed}. The schema contains ${schema.columns.length} columns.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, seed, schema.columns]);

  // Background Ping to keep Neon Database Active
  useEffect(() => {
    const pingDb = async () => {
      try {
        await fetch('/api/db-ping');
      } catch (e) {
        console.error("Failed to ping DB.");
      }
    };
    pingDb(); // Initial ping
    const interval = setInterval(pingDb, 180000); // Every 3 minutes
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim());
      const parsedData = lines.slice(1).map((line, idx) => {
        const cols = line.split(',');
        const row: any = { id: idx + 1 };
        headers.forEach((h, i) => {
          row[h] = cols[i]?.trim();
        });
        return row;
      });
      
      // We mutate the store directly for CSV imports just for UI sake, 
      // though typically this should be a store action. 
      // For now, we'll assume the user is bypassing the generator.
      useLaboratoryStore.setState({ 
        dataset: parsedData,
        bitmapIndex: buildDatasetBitmapIndex(parsedData, headers),
        schema: { ...schema, columns: headers.map(h => ({ name: h, type: 'string', cardinality: 0, distribution: 'Uniform' }))}
      });
      setExplanation(`Successfully loaded ${parsedData.length} rows from CSV file!`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReport = () => {
    const reportData = {
      metadata: { rowCount: dataset.length, schema: schema.columns },
      dataset,
      bitmapIndex
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bitmap_index_report.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const askAi = async () => {
    setAiLoading(true);
    setExplanation("Thinking...");
    try {
      const res = await fetch('/api/ask-bitmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: { rowCount, columns: schema.columns },
          activeValue: activeValue?.val,
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

  const executeDbQuery = async () => {
    setQueryExecuting(true);
    setQueryResultMsg("Executing on Neon DB...");
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      if (data.error) {
        setQueryResultMsg(`Error: ${data.error}`);
      } else {
        setQueryResultMsg(`Execution Time: ${data.executionTimeMs}ms. Returned ${data.results?.length} rows.`);
      }
    } catch (e) {
      setQueryResultMsg("Execution failed.");
    } finally {
      setQueryExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative">
      
      {/* Compare Modal */}
      <AnimatePresence>
        {compareModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-lg w-[400px]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><GitCompare className="w-5 h-5 text-blue-400"/> Educational Compare Size</h3>
              <p className="text-sm text-neutral-400 mb-4">
                Conceptual comparison of memory footprint. (Not a real PostgreSQL physical calculation).
              </p>
              <div className="space-y-4">
                <div className="bg-neutral-950 p-3 rounded">
                  <div className="text-xs text-neutral-500 mb-1">Traditional Table Scan (Conceptual)</div>
                  <div className="font-mono text-blue-400">{dataset.length * schema.columns.length * 8} bytes</div>
                </div>
                <div className="bg-neutral-950 p-3 rounded">
                  <div className="text-xs text-neutral-500 mb-1">Total Bitmap Index Footprint</div>
                  <div className="font-mono text-emerald-400">
                    {Object.values(bitmapIndex).reduce((acc, colIndex) => 
                      acc + Object.values(colIndex).reduce((colAcc, bmp) => colAcc + Math.ceil(bmp.length / 8), 0)
                    , 0)} bytes
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setCompareModalOpen(false)}
                className="mt-6 w-full bg-neutral-800 hover:bg-neutral-700 py-2 rounded transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500 w-6 h-6" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Bitmap Index Laboratory
          </h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setCompareModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <GitCompare className="w-4 h-4" /> Compare
          </button>
          <button onClick={handleReport} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <Download className="w-4 h-4" /> Report
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-80 border-r border-neutral-800 bg-neutral-900/30 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 custom-scrollbar">
          <div>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Global Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-neutral-300 flex justify-between">
                  <span>Row Count</span>
                  <span className="text-blue-400 font-mono">{rowCount}</span>
                </label>
                <input 
                  type="range" min="5" max="1000" step="5" value={rowCount} 
                  onChange={(e) => setRowCount(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1 text-neutral-300 flex justify-between">
                  <span>Random Seed</span>
                  <span className="text-amber-400 font-mono">{seed}</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="number" value={seed} 
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                  <button onClick={() => setSeed(Math.floor(Math.random()*10000))} className="p-1.5 bg-neutral-800 rounded hover:bg-neutral-700"><Shuffle className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-neutral-800" />

          <div>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" /> Column Definitions
            </h2>
            <div className="space-y-4">
              {schema.columns.map(col => (
                <div key={col.name} className="bg-neutral-900/50 p-3 rounded border border-neutral-800 space-y-2">
                  <div className="font-medium text-blue-300 text-sm">{col.name}</div>
                  
                  <div className="flex gap-2 text-xs">
                    <div className="flex-1">
                      <label className="text-neutral-500 block mb-1">Cardinality</label>
                      <input 
                        type="number" min="1" max="100" value={col.cardinality}
                        onChange={e => updateColumnDef(col.name, { cardinality: Number(e.target.value) })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-neutral-500 block mb-1">Distribution</label>
                      <select 
                        value={col.distribution}
                        onChange={e => updateColumnDef(col.name, { distribution: e.target.value as any })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 outline-none"
                      >
                        <option>Uniform</option>
                        <option>Cyclic</option>
                        <option>Random</option>
                        <option>Skewed</option>
                        <option>Zipf</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mt-auto pt-4">
            <button 
              onClick={generateData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium"
            >
              Regenerate Data
            </button>
            <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload CSV
            </button>
          </div>
        </aside>

        {/* Center: Visualization */}
        <main className="flex-1 p-6 overflow-y-auto bg-neutral-950">
          <div className="grid grid-cols-2 gap-8 h-full">
            
            {/* Table View */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50 flex flex-col min-h-[500px]">
              <div className="bg-neutral-800/80 px-4 py-2 border-b border-neutral-700 font-medium text-sm flex justify-between">
                <span>Dataset Table</span>
                <span className="text-xs text-neutral-500">{dataset.length} rows</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
                    <tr className="text-neutral-400">
                      <th className="py-2 px-4 font-medium border-r border-neutral-800/50 w-16">ID</th>
                      {schema.columns.map(col => (
                        <th key={col.name} className="py-2 px-4 font-medium border-r border-neutral-800/50">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.map((row) => (
                      <tr 
                        key={row.id}
                        className={`border-b border-neutral-800/30 cursor-pointer transition-colors
                          ${activeRow === row.id ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-neutral-800/50'}
                        `}
                        onClick={() => {
                          setActiveRow(activeRow === row.id ? null : row.id);
                          setActiveValue(null);
                        }}
                      >
                        <td className="py-1.5 px-4 text-neutral-500 font-mono text-xs border-r border-neutral-800/30">#{row.id}</td>
                        {schema.columns.map(col => {
                          const val = String(row[col.name]);
                          const isMatch = activeValue?.col === col.name && activeValue?.val === val;
                          return (
                            <td key={col.name} className={`py-1.5 px-4 border-r border-neutral-800/30 ${isMatch ? 'text-amber-400 font-bold' : ''}`}>
                              {val}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bitmap View */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50 flex flex-col min-h-[500px]">
              <div className="bg-neutral-800/80 px-4 py-2 border-b border-neutral-700 font-medium text-sm flex justify-between items-center">
                <span>Bitmap Index Arrays</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                
                {Object.entries(bitmapIndex).map(([colName, colIndex]) => (
                  <div key={colName} className="space-y-4">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">{colName} Index</h3>
                    {Object.entries(colIndex).map(([val, bitmap]) => (
                      <div key={val} className="space-y-1">
                        <div 
                          className="flex justify-between text-xs cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={() => {
                            setActiveValue(activeValue?.val === val && activeValue?.col === colName ? null : {col: colName, val});
                            setActiveRow(null);
                          }}
                        >
                          <span className={`font-medium ${activeValue?.val === val && activeValue?.col === colName ? 'text-blue-400' : 'text-neutral-300'}`}>{val}</span>
                          <span className="text-neutral-500 font-mono">
                            Density: {Math.round(bitmap.density * 100)}%
                          </span>
                        </div>
                        
                        {/* Simplified vector representation for large arrays to prevent DOM explosion (Epic 2 will use react-virtual) */}
                        {bitmap.bits.length <= 100 ? (
                          <div className="flex flex-wrap gap-0.5">
                            {bitmap.bits.map((bit, idx) => {
                              const rowId = dataset[idx]?.id;
                              const isActive = activeRow === rowId || (activeValue?.col === colName && activeValue?.val === val);
                              return (
                                <div
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveRow(activeRow === rowId ? null : rowId);
                                    setActiveValue(null);
                                  }}
                                  className={`w-3.5 h-3.5 flex items-center justify-center text-[8px] rounded-sm font-mono cursor-pointer
                                    ${bit === 1 
                                      ? isActive ? 'bg-blue-500 text-white' : 'bg-blue-500/40 text-blue-200' 
                                      : isActive ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-800 text-neutral-600'
                                    }
                                  `}
                                >
                                  {bit}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="w-full bg-neutral-800 h-4 rounded overflow-hidden flex relative group cursor-pointer"
                               onClick={() => {
                                 setActiveValue(activeValue?.val === val && activeValue?.col === colName ? null : {col: colName, val});
                                 setActiveRow(null);
                               }}>
                            {/* Visual summary bar instead of 1000 DOM nodes */}
                            <div className="absolute inset-0 bg-blue-500/20" style={{ width: `${bitmap.density * 100}%` }}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-neutral-400 font-mono">
                              {bitmap.setBitCount} bits set / {bitmap.length} total
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
                <span className="animate-pulse">Analyzing context...</span>
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
            <Sparkles className="w-4 h-4" /> Explain This
          </button>
        </aside>

      </div>
    </div>
  );
}
