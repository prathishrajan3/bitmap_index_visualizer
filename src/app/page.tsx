"use client";
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Settings2, Database, Sparkles, Download, Upload, Shuffle, Blocks, Calculator, FileArchive, Table2, LayoutGrid, GraduationCap, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { useLearningStore } from '@/store/useLearningStore';
import { buildDatasetBitmapIndex, Bitmap, ColumnDefinition } from '@/lib/bitmap';
import { generateFallbackThemedDataset } from '@/lib/dataset/themedDatasetGenerator';

// Components
import { BitmapMatrix } from '@/components/bitmap/BitmapMatrix';
import { BitmapBuilder } from '@/components/bitmap/BitmapBuilder';
import { BitmapAlgebra } from '@/components/bitmap/BitmapAlgebra';
import { Introduction } from '@/components/learning/Introduction';
import { BookOpen, User, HelpCircle, Brain } from 'lucide-react';
import { DeveloperInfo } from '@/components/about/DeveloperInfo';
import { HelpManual } from '@/components/help/HelpManual';
import { DownloadReportBtn } from '@/components/report/DownloadReportBtn';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { QuizApp } from '@/components/quiz/QuizApp';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
type Tab = 'Intro' | 'Dataset' | 'Builder' | 'Matrix' | 'Algebra' | 'Quiz' | 'Help' | 'Developed By';


export default function LaboratoryDashboard() {
  const { 
    dataset, 
    schema, 
    bitmapIndex, 
    loadExternalDataset, 
    generateData, 
    updateColumnDef, 
    addColumnDef, 
    removeColumnDef, 
    setRowCount, 
    setSeed, 
    seed, 
    rowCount, 
    buildIndexes,
    setQueryRecord 
  } = useLaboratoryStore();
  
  const { currentModuleId, completeModule, modules } = useLearningStore();
  
  // Local UI State
  const [activeTab, setActiveTab] = useState<Tab>('Intro');
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeValue, setActiveValue] = useState<{col: string, val: string} | null>(null);
  const [explanation, setExplanation] = useState<string>("Configure your experiment and click Generate Data.");


  
  const [selectedBuildColumns, setSelectedBuildColumns] = useState<string[]>([]);
  useEffect(() => {
    setSelectedBuildColumns(schema.columns.map(c => c.name));
  }, [schema.columns]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate Data automatically on mount and config change
  const isInitialMount = useRef(true);
  const skipNextGenerate = useRef(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      generateData();
      return;
    }
    if (skipNextGenerate.current) {
      skipNextGenerate.current = false;
      return;
    }
    generateData();
    setExplanation(`Generated ${rowCount} rows using Seed ${seed}. The schema contains ${schema.columns.length} columns.`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, seed]);


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
      
      skipNextGenerate.current = true;
      const parsedColumns = headers.map(h => {
        const distinctValues = new Set(parsedData.map(r => r[h]));
        return { name: h, type: 'string' as const, cardinality: distinctValues.size, distribution: 'Uniform' as const };
      });
      loadExternalDataset(parsedData, parsedColumns, 'CSV Import', 'csv');
      buildIndexes(headers);
      setExplanation(`Successfully loaded ${parsedData.length} rows from CSV file!`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [aiDatasetPrompt, setAiDatasetPrompt] = useState('');

  const handleAddColumnWithAi = async () => {
    setIsAddingColumn(true);
    setExplanation("Adding column and generating domain-relevant data...");
    try {
      await new Promise(r => setTimeout(r, 120));
      const count = schema.columns.length + 1;
      const placeholderName = `Column ${count}`;
      const updatedCols = [
        ...schema.columns,
        {
          name: placeholderName,
          type: 'string' as const,
          cardinality: 3,
          distribution: 'Uniform' as const
        }
      ];

      // Instant client-side generation (0ms network latency, 0 Vercel serverless CPU/invocations)
      const data = generateFallbackThemedDataset(
        aiDatasetPrompt.trim() ? `${aiDatasetPrompt.trim()} - add a new column` : 'add a relevant domain column',
        rowCount,
        updatedCols
      );

      if (data.dataset && data.dataset.length > 0) {
        skipNextGenerate.current = true;
        const columns: ColumnDefinition[] = data.columns && data.columns.length > 0
          ? data.columns.map((c: any, idx: number) => ({
              id: c.id || `col-${idx + 1}`,
              name: c.name,
              type: (c.type === 'number' || c.type === 'boolean' ? c.type : 'string') as 'string' | 'number' | 'boolean',
              cardinality: c.cardinality || 3,
              distribution: (c.distribution as any) || 'Uniform'
            }))
          : Object.keys(data.dataset[0]).filter((k: string) => k !== 'id').map((name: string, idx: number) => {
              const distinctVals = new Set(data.dataset.map((r: any) => r[name]));
              return {
                id: `col-${idx + 1}`,
                name,
                type: 'string' as const,
                cardinality: distinctVals.size,
                distribution: 'Uniform' as const
              };
            });

        loadExternalDataset(data.dataset, columns, data.domain || undefined, 'ai');
        const colNames = columns.map((c: any) => c.name).join(', ');
        setExplanation(`Added column and generated domain-relevant dataset with columns: ${colNames}!`);
      } else {
        addColumnDef();
      }
    } catch (e) {
      addColumnDef();
      setExplanation("Added column to schema.");
    } finally {
      setIsAddingColumn(false);
    }
  };

  const handleAiGenerateDataset = async () => {
    setIsAiGenerating(true);
    setExplanation("Generating pedagogically optimized dataset...");
    try {
      await new Promise(r => setTimeout(r, 180));
      // Instant client-side generation (0ms network latency, 0 Vercel serverless CPU/invocations)
      const data = generateFallbackThemedDataset(aiDatasetPrompt, rowCount, schema.columns);

      if (data.dataset && data.dataset.length > 0) {
        skipNextGenerate.current = true;
        const columns: ColumnDefinition[] = data.columns && data.columns.length > 0
          ? data.columns.map((c: any, idx: number) => ({
              id: c.id || `col-${idx + 1}`,
              name: c.name,
              type: (c.type === 'number' || c.type === 'boolean' ? c.type : 'string') as 'string' | 'number' | 'boolean',
              cardinality: c.cardinality || 3,
              distribution: (c.distribution as any) || 'Uniform'
            }))
          : Object.keys(data.dataset[0]).filter((k: string) => k !== 'id').map((name: string, idx: number) => {
              const distinctVals = new Set(data.dataset.map((r: any) => r[name]));
              return {
                id: `col-${idx + 1}`,
                name,
                type: 'string' as const,
                cardinality: distinctVals.size,
                distribution: 'Uniform' as const
              };
            });

        loadExternalDataset(data.dataset, columns, data.domain || aiDatasetPrompt.trim() || undefined, 'ai');
        const colNames = columns.map((c: any) => c.name).join(', ');
        setExplanation(`Generated dataset for "${data.domain || aiDatasetPrompt.trim() || 'Custom Theme'}" with columns: ${colNames}!`);
      }
    } catch (e) {
      setExplanation("Failed to generate dataset.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleGenerateData = () => {
    generateData();
    setExplanation("Data generated successfully based on configuration.");
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
            setActiveTab('Intro');
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full flex items-center gap-2 font-bold transition-transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
        >
          <CheckCircle2 className="w-5 h-5" /> Mark Module as Complete
        </button>
      </div>
    );
  };

  // Extract all bitmaps into a flat array for Algebra and Compression labs (memoized by bitmapIndex)
  const allBitmaps = useMemo<Bitmap[]>(() => {
    const list: Bitmap[] = [];
    if (bitmapIndex && typeof bitmapIndex === 'object') {
      Object.values(bitmapIndex).forEach(colIndex => {
        if (colIndex && typeof colIndex === 'object') {
          Object.values(colIndex).forEach(bmp => {
            if (bmp && Array.isArray(bmp.bits)) {
              list.push(bmp);
            }
          });
        }
      });
    }
    return list;
  }, [bitmapIndex]);

  return (
    <div className="h-screen h-[100dvh] max-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* Compare Modal Removed - now a Tab */}

      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Database className="text-blue-500 w-6 h-6" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Bitmap Index Laboratory
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <ThemeToggle />
          <DownloadReportBtn type="lab" />
          <Link href="/city" className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm transition-colors">
            <LayoutGrid className="w-4 h-4" /> Smart City
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* Left Sidebar: Controls */}
        <aside className="w-72 xl:w-80 border-r border-neutral-800 bg-neutral-900/30 flex flex-col shrink-0 min-h-0 h-full">
          <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 overflow-y-auto custom-scrollbar">
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
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
            
            <hr className="border-neutral-800 shrink-0" />

            <div>
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" /> Column Definitions
              </h2>
              <div className="space-y-4">
                {schema.columns.map((col, idx) => (
                  <div key={col.id || `col-${idx}`} className="bg-neutral-900/50 p-3 rounded border border-neutral-800 space-y-2 relative group">
                    <button 
                      onClick={() => removeColumnDef(col.id || col.name)}
                      className="absolute top-2 right-2 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove column"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <input 
                      type="text"
                      value={col.name}
                      onChange={e => updateColumnDef(col.id || col.name, { name: e.target.value })}
                      className="font-medium text-blue-300 text-sm bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-blue-500 outline-none w-5/6 transition-colors"
                    />
                    
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1">
                        <label className="text-neutral-500 block mb-1">Cardinality</label>
                        <input 
                          type="number" min="1" max="1000" value={col.cardinality}
                          onChange={e => updateColumnDef(col.id || col.name, { cardinality: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-neutral-500 block mb-1">Distribution</label>
                        <select 
                          value={col.distribution}
                          onChange={e => updateColumnDef(col.id || col.name, { distribution: e.target.value as any })}
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
                <button 
                  onClick={handleAddColumnWithAi}
                  disabled={isAddingColumn || isAiGenerating}
                  className="w-full border border-dashed border-neutral-700 hover:border-blue-500 text-neutral-500 hover:text-blue-400 py-2 rounded-md transition-colors text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" /> {isAddingColumn ? 'Naming & Generating Column...' : 'Add Column'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 pt-3 border-t border-neutral-800 flex flex-col gap-2 shrink-0 bg-neutral-900/40">
            <input 
              type="text"
              placeholder="Optional: custom context for AI..."
              value={aiDatasetPrompt}
              onChange={e => setAiDatasetPrompt(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 transition-colors"
            />
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
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-neutral-950">
          
          {/* Tab Bar */}
          <div className="flex bg-[#0a0a0c] border-b border-neutral-800 px-4 pt-2 gap-1 overflow-x-auto shrink-0 flex-nowrap custom-scrollbar scroll-smooth">
            <TabBtn icon={<BookOpen className="w-4 h-4 shrink-0"/>} label="Introduction" active={activeTab==='Intro'} onClick={() => setActiveTab('Intro')} />
            <div className="w-px bg-neutral-800 mx-1 my-2 shrink-0"></div>
            <TabBtn icon={<Table2 className="w-4 h-4 shrink-0"/>} label="Dataset" active={activeTab==='Dataset'} onClick={() => setActiveTab('Dataset')} />
            <TabBtn icon={<Blocks className="w-4 h-4 shrink-0"/>} label="Builder" active={activeTab==='Builder'} onClick={() => setActiveTab('Builder')} />
            <TabBtn icon={<LayoutGrid className="w-4 h-4 shrink-0"/>} label="Matrix" active={activeTab==='Matrix'} onClick={() => setActiveTab('Matrix')} />
            <TabBtn icon={<Calculator className="w-4 h-4 shrink-0"/>} label="Algebra" active={activeTab==='Algebra'} onClick={() => setActiveTab('Algebra')} />

            <div className="w-px bg-neutral-800 mx-1 my-2 shrink-0"></div>
            <TabBtn icon={<Brain className="w-4 h-4 shrink-0"/>} label="Quiz" active={activeTab==='Quiz'} onClick={() => setActiveTab('Quiz')} />
            <TabBtn icon={<HelpCircle className="w-4 h-4 shrink-0"/>} label="Help" active={activeTab==='Help'} onClick={() => setActiveTab('Help')} />
            <TabBtn icon={<User className="w-4 h-4 shrink-0"/>} label="Developed By" active={activeTab==='Developed By'} onClick={() => setActiveTab('Developed By')} />
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar min-h-0">
            
            {activeTab === 'Intro' && (
              <div className="h-full">
                <Introduction />
              </div>
            )}

            {activeTab === 'Quiz' && (
              <div className="h-full overflow-y-auto">
                <QuizApp />
              </div>
            )}

            {activeTab === 'Developed By' && (
              <div className="h-full overflow-y-auto">
                <DeveloperInfo />
              </div>
            )}

            {activeTab === 'Help' && (
              <div className="h-full overflow-y-auto">
                <HelpManual />
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
                  {allBitmaps.length > 0 ? (
                    <div className="space-y-8 pb-10">
                      {allBitmaps.map((bmp, i) => (
                          <div key={i} className="border-b border-neutral-800 pb-8 last:border-0">
                            <h3 className="text-md font-semibold text-neutral-400 mb-4">Building vector for: {bmp.sourceColumn} = {String(bmp.sourceValue)}</h3>
                            <BitmapBuilder dataset={dataset} bitmap={bmp} />
                          </div>
                        ))
                      }
                    </div>
                  ) : dataset.length > 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-6 mt-10">
                      <p className="text-lg">Select columns to construct bitmap indexes for:</p>
                      
                      <div className="flex flex-wrap gap-4 justify-center max-w-2xl bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
                        {schema.columns.map(col => (
                          <label key={col.name} className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-4 py-2 rounded-md border border-neutral-800 hover:border-neutral-600 transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-blue-600 bg-neutral-900 border-neutral-700 rounded focus:ring-blue-600 focus:ring-2"
                              checked={selectedBuildColumns.includes(col.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBuildColumns([...selectedBuildColumns, col.name]);
                                } else {
                                  setSelectedBuildColumns(selectedBuildColumns.filter(c => c !== col.name));
                                }
                              }}
                            />
                            <span className="text-neutral-300 font-medium">{col.name}</span>
                          </label>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          if (selectedBuildColumns.length === 0) {
                            setExplanation("Please select at least one column to build indexes for.");
                            return;
                          }
                          buildIndexes(selectedBuildColumns);
                          setExplanation("Indexes built! You can now visualize the construction below or proceed to the Matrix tab.");
                        }}
                        disabled={selectedBuildColumns.length === 0}
                        className={`py-3 px-8 rounded-md transition-colors font-bold flex items-center justify-center gap-2 ${
                          selectedBuildColumns.length > 0 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <Blocks className="w-5 h-5" /> Build Selected Bitmap Indexes
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-neutral-500">
                      <p>Generate or upload a dataset first to start building bitmap indexes.</p>
                    </div>
                  )}
                </div>
                {renderMarkComplete('construction')}
              </div>
            )}

            {activeTab === 'Matrix' && (
              <div className="h-full flex flex-col space-y-6">
                <h2 className="text-lg font-bold mb-2 text-neutral-300 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-blue-400"/> Virtualized Bitmap Matrix</h2>
                {allBitmaps.length > 0 ? (
                  allBitmaps.map((bmp, i) => (
                    <BitmapMatrix 
                      key={i} 
                      bitmap={bmp} 
                      activeRowId={activeRow}
                      onBitClick={(id) => {
                        setActiveRow(activeRow === id ? null : id);
                        setActiveValue(activeValue?.col === bmp.sourceColumn && activeValue?.val === String(bmp.sourceValue) ? null : {col: bmp.sourceColumn, val: String(bmp.sourceValue)});
                      }}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64 text-neutral-500 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                    <p>Please build the bitmap indexes in the Builder tab first.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Algebra' && (
              <div className="h-full flex flex-col">
                <h2 className="text-lg font-bold mb-4 text-neutral-300 flex items-center gap-2 shrink-0"><Calculator className="w-5 h-5 text-blue-400"/> Boolean Algebra Playground</h2>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  <ErrorBoundary fallbackTitle="Boolean Algebra Playground">
                    {allBitmaps.length > 0 ? (
                      <BitmapAlgebra availableBitmaps={allBitmaps} />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-neutral-500 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                        <p>Please build the bitmap indexes in the Builder tab first.</p>
                      </div>
                    )}
                  </ErrorBoundary>
                </div>
                {renderMarkComplete('algebra')}
              </div>
            )}



            

          </div>
        </main>



      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center gap-2 px-3 py-2.5 text-[13px] transition-colors whitespace-nowrap outline-none
        ${active ? 'text-white font-semibold' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/30 rounded-t-lg'}
      `}
    >
      {icon} {label}
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
      )}
    </button>
  );
}
