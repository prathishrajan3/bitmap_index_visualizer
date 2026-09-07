"use client";

import { useState, useEffect, useRef } from 'react';
import { Settings2, Database, Sparkles, Download, GitCompare, Upload, Search, Terminal, Shuffle, Blocks, Calculator, FileArchive, Table2, LayoutGrid, GraduationCap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { useLearningStore } from '@/store/useLearningStore';
import { buildDatasetBitmapIndex, Bitmap } from '@/lib/bitmap';

// Components
import { BitmapMatrix } from '@/components/bitmap/BitmapMatrix';
import { BitmapBuilder } from '@/components/bitmap/BitmapBuilder';
import { BitmapAlgebra } from '@/components/bitmap/BitmapAlgebra';
import { CompressionLab } from '@/components/bitmap/CompressionLab';
import { QueryPlanVisualizer } from '@/components/query/QueryPlanVisualizer';
import { BTreeVisualizer } from '@/components/query/BTreeVisualizer';
import { LearningJourney } from '@/components/learning/LearningJourney';
import { Glossary } from '@/components/learning/Glossary';
import { BookOpen } from 'lucide-react';

type Tab = 'Dataset' | 'Builder' | 'Matrix' | 'Algebra' | 'Compression' | 'Query' | 'QueryPlan' | 'BTree' | 'Journey';



export default function LaboratoryDashboard() {
  const { 
    rowCount, seed, schema, dataset, bitmapIndex, 
    setRowCount, setSeed, updateColumnDef, generateData, loadExternalDataset 
  } = useLaboratoryStore();
  
  const { currentModuleId, completeModule, modules } = useLearningStore();
  
  // Local UI State
  const [activeTab, setActiveTab] = useState<Tab>('Journey');
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeValue, setActiveValue] = useState<{col: string, val: string} | null>(null);
  const [explanation, setExplanation] = useState<string>("Configure your experiment and click Generate Data.");
  const [aiLoading, setAiLoading] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

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

  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleAiGenerateDataset = async () => {
    setIsAiGenerating(true);
    setExplanation("Asking AI to generate a pedagogically perfect dataset...");
    try {
      const res = await fetch('/api/generate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowCount, schema: schema.columns })
      });
      const data = await res.json();
      if (data.error) {
        setExplanation(`Error: ${data.error}`);
      } else if (data.dataset) {
        loadExternalDataset(data.dataset);
        setExplanation("AI successfully generated and loaded the dataset!");
      }
    } catch (e) {
      setExplanation("Failed to contact the AI generator.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleGenerateData = () => {
    generateData();
    setExplanation("Data generated successfully based on configuration.");
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

  const generateAiQuery = async () => {
    setQueryExecuting(true);
    setQueryResultMsg("Generating query...");
    try {
      const cols = schema.columns.map(c => `${c.name} ${c.type}`).join(', ');
      const res = await fetch('/api/generate-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          schemaContext: `Table: DatasetRow (id INT, ${cols})`,
          prompt: sqlPrompt 
        })
      });
      const data = await res.json();
      setSqlQuery(data.query || "SELECT * FROM DatasetRow;");
      setQueryResultMsg("Query generated by AI!");
    } catch (e) {
      setQueryResultMsg("Failed to generate query.");
    } finally {
      setQueryExecuting(false);
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
        // Try to visualize result if it's a specific value
        const match = sqlQuery.match(/([a-zA-Z0-9_]+)\s*=\s*'([^']+)'/i);
        if (match && match[1] && match[2]) {
          setActiveValue({col: match[1], val: match[2]});
          setActiveTab('Matrix');
        }
      }
    } catch (e) {
      setQueryResultMsg("Execution failed.");
    } finally {
      setQueryExecuting(false);
    }
  };

  const renderMarkComplete = (moduleId: string) => {
    const mod = modules[moduleId];
    if (!mod || mod.completed || currentModuleId !== moduleId) return null;
    
    return (
      <div className="mt-8 flex justify-center border-t border-neutral-800 pt-6 pb-4 shrink-0">
        <button 
          onClick={() => {
            completeModule(moduleId, 100);
            setExplanation(`Excellent! You have mastered the ${mod.title} module.`);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full flex items-center gap-2 font-bold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
        >
          <CheckCircle2 className="w-5 h-5" /> Mark Module as Complete
        </button>
      </div>
    );
  };

  // Extract all bitmaps into a flat array for Algebra and Compression labs
  const allBitmaps: Bitmap[] = [];
  Object.values(bitmapIndex).forEach(colIndex => {
    Object.values(colIndex).forEach(bmp => {
      allBitmaps.push(bmp);
    });
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-hidden">
      
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
                    {allBitmaps.reduce((acc, bmp) => acc + Math.ceil(bmp.length / 8), 0)} bytes
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
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500 w-6 h-6" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Bitmap Index Laboratory
          </h1>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setGlossaryOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 border border-blue-900/50 text-sm transition-colors">
            <BookOpen className="w-4 h-4" /> Glossary
          </button>
          <button onClick={() => setCompareModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <GitCompare className="w-4 h-4" /> Compare
          </button>
          <button onClick={handleReport} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <Download className="w-4 h-4" /> Report
          </button>
        </div>
      </header>

      {/* Glossary Slideover */}
      <Glossary isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

      {/* Main Layout */}
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
                  type="range" min="5" max="10000" step="5" value={rowCount} 
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
                        type="number" min="1" max="1000" value={col.cardinality}
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
              onClick={handleAiGenerateDataset}
              disabled={isAiGenerating}
              className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 hover:bg-emerald-600/30 py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {isAiGenerating ? 'Generating...' : 'Generate with AI'}
            </button>
            <button 
              onClick={generateData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" /> Regenerate Data
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

        {/* Center: Tabs & Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          
          {/* Tab Bar */}
          <div className="flex bg-neutral-900/50 border-b border-neutral-800 p-2 gap-2 overflow-x-auto shrink-0 flex-nowrap custom-scrollbar">
            <TabBtn icon={<GraduationCap className="w-4 h-4 shrink-0"/>} label="Journey" active={activeTab==='Journey'} onClick={() => setActiveTab('Journey')} />
            <div className="w-px bg-neutral-800 mx-2 shrink-0"></div>
            <TabBtn icon={<Table2 className="w-4 h-4 shrink-0"/>} label="Dataset" active={activeTab==='Dataset'} onClick={() => setActiveTab('Dataset')} />
            <TabBtn icon={<Blocks className="w-4 h-4 shrink-0"/>} label="Builder" active={activeTab==='Builder'} onClick={() => setActiveTab('Builder')} />
            <TabBtn icon={<LayoutGrid className="w-4 h-4 shrink-0"/>} label="Matrix" active={activeTab==='Matrix'} onClick={() => setActiveTab('Matrix')} />
            <TabBtn icon={<Calculator className="w-4 h-4 shrink-0"/>} label="Algebra" active={activeTab==='Algebra'} onClick={() => setActiveTab('Algebra')} />
            <TabBtn icon={<FileArchive className="w-4 h-4 shrink-0"/>} label="Compression" active={activeTab==='Compression'} onClick={() => setActiveTab('Compression')} />
            <TabBtn icon={<Terminal className="w-4 h-4 shrink-0"/>} label="Neon Query" active={activeTab==='Query'} onClick={() => setActiveTab('Query')} />
            <div className="w-px bg-neutral-800 mx-2 shrink-0"></div>
            <TabBtn icon={<Search className="w-4 h-4 shrink-0"/>} label="Query Plan" active={activeTab==='QueryPlan'} onClick={() => setActiveTab('QueryPlan')} />
            <TabBtn icon={<Blocks className="w-4 h-4 shrink-0"/>} label="B-Tree Lab" active={activeTab==='BTree'} onClick={() => setActiveTab('BTree')} />
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            
            {activeTab === 'Journey' && (
              <div className="h-full">
                <LearningJourney onNavigate={(tab) => setActiveTab(tab as Tab)} />
              </div>
            )}

            {activeTab === 'Dataset' && (
              <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50 flex flex-col h-full">
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
                {renderMarkComplete('intro')}
              </div>
            )}

            {activeTab === 'Builder' && (
              <div className="h-full space-y-8 flex flex-col">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2 shrink-0"><Blocks className="w-5 h-5 text-blue-400"/> Bitmap Construction Visualizer</h2>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {schema.columns.map(col => allBitmaps.find(b => b.sourceColumn === col.name)).filter(Boolean).length > 0 ? (
                    <div className="space-y-8 pb-10">
                      {schema.columns
                        .map(col => allBitmaps.find(b => b.sourceColumn === col.name))
                        .filter(Boolean)
                        .map((bmp, i) => (
                          <div key={i} className="border-b border-neutral-800 pb-8 last:border-0">
                            <h3 className="text-md font-semibold text-neutral-400 mb-4">Building vector for: {bmp!.sourceColumn} = {String(bmp!.sourceValue)}</h3>
                            <BitmapBuilder dataset={dataset} bitmap={bmp!} />
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="text-neutral-500">Generate a dataset first.</div>
                  )}
                </div>
                {renderMarkComplete('construction')}
              </div>
            )}

            {activeTab === 'Matrix' && (
              <div className="h-full flex flex-col space-y-6">
                <h2 className="text-lg font-bold mb-2 text-neutral-300 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-blue-400"/> Virtualized Bitmap Matrix</h2>
                {allBitmaps.map((bmp, i) => (
                  <BitmapMatrix 
                    key={i} 
                    bitmap={bmp} 
                    activeRowId={activeRow}
                    onBitClick={(id) => {
                      setActiveRow(activeRow === id ? null : id);
                      setActiveValue(activeValue?.col === bmp.sourceColumn && activeValue?.val === String(bmp.sourceValue) ? null : {col: bmp.sourceColumn, val: String(bmp.sourceValue)});
                    }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'Algebra' && (
              <div className="h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2 shrink-0"><Calculator className="w-5 h-5 text-blue-400"/> Boolean Algebra Playground</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <BitmapAlgebra availableBitmaps={allBitmaps} />
                </div>
                {renderMarkComplete('algebra')}
              </div>
            )}

            {activeTab === 'Compression' && (
              <div className="h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2 shrink-0"><FileArchive className="w-5 h-5 text-blue-400"/> Compression Laboratory</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <CompressionLab availableBitmaps={allBitmaps} />
                </div>
                {renderMarkComplete('compression')}
              </div>
            )}

            {activeTab === 'Query' && (
              <div className="h-full">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2"><Terminal className="w-5 h-5 text-blue-400"/> Neon DB Query Execution</h2>
                
                <div className="bg-neutral-900/50 border border-neutral-800 rounded p-6 max-w-2xl space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Generate SQL via AI</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. Find rows where Department is CSE" 
                        value={sqlPrompt}
                        onChange={e => setSqlPrompt(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-sm outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={generateAiQuery}
                        disabled={queryExecuting}
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 hover:bg-emerald-600/30 px-4 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" /> Generate
                      </button>
                    </div>
                  </div>

                  <hr className="border-neutral-800" />

                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Raw SQL Execution</label>
                    <textarea
                      value={sqlQuery}
                      onChange={e => setSqlQuery(e.target.value)}
                      placeholder="SELECT * FROM DatasetRow;"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-4 text-sm font-mono h-32 outline-none focus:border-blue-500 mb-2"
                    />
                    <button 
                      onClick={executeDbQuery}
                      disabled={queryExecuting || !sqlQuery}
                      className="w-full bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/30 py-3 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" /> Execute on Neon Database
                    </button>
                  </div>

                  {queryResultMsg && (
                    <div className="text-sm text-neutral-300 bg-neutral-950 border border-neutral-800 p-4 rounded mt-4 break-words font-mono">
                      {queryResultMsg}
                    </div>
                  )}
                </div>

              </div>
            )}
            
            {activeTab === 'QueryPlan' && (
              <div className="h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2 shrink-0"><Search className="w-5 h-5 text-blue-400"/> Query Execution Plan Visualizer</h2>
                <div className="flex-1 min-h-0">
                  <QueryPlanVisualizer />
                </div>
                {renderMarkComplete('execution')}
              </div>
            )}

            {activeTab === 'BTree' && (
              <div className="h-full">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2"><Blocks className="w-5 h-5 text-blue-400"/> Conceptual B-Tree Laboratory</h2>
                <BTreeVisualizer />
              </div>
            )}
            
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

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors whitespace-nowrap
        ${active ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}
      `}
    >
      {icon} {label}
    </button>
  );
}
