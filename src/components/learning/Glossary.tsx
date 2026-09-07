'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, X, Search, ChevronRight, Layers, Filter, CheckCircle2, ChevronLeft, Lightbulb, GraduationCap, Zap, Database, GitMerge, FileArchive, AlignLeft, SplitSquareHorizontal, Sparkles } from 'lucide-react';
import { glossaryTerms, GLOSSARY_CATEGORIES, Category, Difficulty, GlossaryTerm } from '@/data/glossaryTerms';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';

interface GlossaryProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export function Glossary({ isOpen, onClose, onNavigateToTab }: GlossaryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');
  
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [isVivaMode, setIsVivaMode] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { dataset, schema, bitmapIndex } = useLaboratoryStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        if (selectedTermId) setSelectedTermId(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedTermId, onClose]);

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch = 
        searchTerm === '' ||
        term.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.aliases.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        term.shortDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.beginnerExplanation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === 'All' || term.difficulty === difficultyFilter;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, selectedCategory, difficultyFilter]);

  const selectedTerm = useMemo(() => {
    return glossaryTerms.find(t => t.id === selectedTermId);
  }, [selectedTermId]);

  const handleTermClick = (id: string) => {
    setSelectedTermId(id);
    setAiExplanation(null);
    setRecentlyViewed(prev => {
      const newRecent = [id, ...prev.filter(t => t !== id)].slice(0, 5);
      return newRecent;
    });
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'Core Bitmap': return <Database className="w-4 h-4 text-blue-400" />;
      case 'Data Characteristics': return <Layers className="w-4 h-4 text-purple-400" />;
      case 'Bitmap Operations': return <SplitSquareHorizontal className="w-4 h-4 text-emerald-400" />;
      case 'Compression': return <FileArchive className="w-4 h-4 text-yellow-400" />;
      case 'Query Execution': return <Zap className="w-4 h-4 text-orange-400" />;
      case 'B-Tree': return <GitMerge className="w-4 h-4 text-pink-400" />;
      case 'Advanced': return <AlignLeft className="w-4 h-4 text-rose-400" />;
      default: return <BookOpen className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'Beginner': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Intermediate': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Advanced': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  const handleAskAi = async () => {
    if (!selectedTerm) return;
    setIsAiLoading(true);
    setAiExplanation("Thinking...");
    try {
      const res = await fetch('/api/ask-bitmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: { rowCount: dataset.length, columns: schema.columns },
          activeValue: selectedTerm.name,
          activeRow: null,
          customPrompt: `Explain the concept "${selectedTerm.name}" in the context of bitmap indexes. The current dataset has ${dataset.length} rows.`
        })
      });
      const data = await res.json();
      setAiExplanation(data.explanation || "No explanation returned.");
    } catch (e) {
      setAiExplanation("Failed to connect to the AI Tutor.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderInteractiveExample = (term: GlossaryTerm) => {
    if (!term.interactiveExampleType) return null;
    
    switch (term.interactiveExampleType) {
      case 'Cardinality': {
        if (!dataset || dataset.length === 0 || schema.columns.length === 0) return <div className="text-neutral-500 text-sm">Load a dataset to see current cardinality.</div>;
        const colName = schema.columns[0].name;
        const distinctValues = new Set(dataset.map(r => r[colName])).size;
        return (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mt-4">
            <h4 className="text-xs font-bold text-neutral-400 mb-2 uppercase">Current Lab Context</h4>
            <div className="text-sm">
              <span className="text-neutral-300">Column: </span><span className="text-blue-400 font-mono">{colName}</span>
            </div>
            <div className="text-sm mt-1">
              <span className="text-neutral-300">Distinct Values: </span><span className="text-emerald-400 font-mono">{distinctValues}</span>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              The cardinality of {colName} in your current dataset is {distinctValues}.
            </div>
          </div>
        );
      }
      case 'Selectivity': {
        return (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mt-4">
            <h4 className="text-xs font-bold text-neutral-400 mb-2 uppercase">Interactive Example</h4>
            <div className="flex items-center gap-4 text-sm font-mono text-neutral-300">
              <div className="flex-1 text-center bg-neutral-950 py-2 border border-neutral-800 rounded">Total: 100 rows</div>
              <div>/</div>
              <div className="flex-1 text-center bg-blue-900/30 text-blue-400 py-2 border border-blue-900/50 rounded">Matches: 20 rows</div>
              <div>=</div>
              <div className="flex-1 text-center bg-emerald-900/30 text-emerald-400 py-2 border border-emerald-900/50 rounded">20% Selectivity</div>
            </div>
          </div>
        );
      }
      case 'BitmapAnd': {
        return (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mt-4 font-mono text-sm text-center space-y-2">
            <div className="flex justify-between items-center w-48 mx-auto text-blue-300"><span>Vector A:</span> <span>1 1 0 1 0</span></div>
            <div className="flex justify-between items-center w-48 mx-auto text-blue-300"><span>Vector B:</span> <span>1 0 1 1 0</span></div>
            <div className="w-48 mx-auto border-t border-neutral-700 my-2"></div>
            <div className="flex justify-between items-center w-48 mx-auto text-emerald-400 font-bold"><span>A AND B:</span> <span>1 0 0 1 0</span></div>
          </div>
        );
      }
      case 'RLE': {
        return (
          <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-lg mt-4 font-mono text-sm text-center">
            <div className="text-neutral-400 mb-1">Original (12 bits):</div>
            <div className="text-blue-300 tracking-[0.2em] mb-4">111110000011</div>
            <div className="text-neutral-400 mb-1">RLE Compressed (3 runs):</div>
            <div className="text-emerald-400">
              (1, 5) &nbsp; (0, 5) &nbsp; (1, 2)
            </div>
          </div>
        );
      }
      // Add other visualizers safely
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950 z-[100] flex flex-col font-sans text-white">
      {/* HEADER */}
      <header className="flex-none bg-neutral-900/50 border-b border-neutral-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Interactive Educational Glossary
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">Understand the database concepts behind the laboratory.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search concepts... e.g. Selectivity" 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setSelectedTermId(null); }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-full py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors bg-neutral-900 border border-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-64 bg-neutral-900/30 border-r border-neutral-800 flex flex-col">
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              <button 
                onClick={() => { setSelectedCategory('All'); setSelectedTermId(null); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === 'All' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
              >
                <Layers className="w-4 h-4" /> All Concepts
                <span className="ml-auto text-xs bg-neutral-800 py-0.5 px-2 rounded-full">{glossaryTerms.length}</span>
              </button>
              
              {GLOSSARY_CATEGORIES.map(cat => {
                const count = glossaryTerms.filter(t => t.category === cat).length;
                return (
                  <button 
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedTermId(null); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedCategory === cat ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'}`}
                  >
                    {getCategoryIcon(cat)}
                    <span className="truncate">{cat}</span>
                    <span className="ml-auto text-xs bg-neutral-800 py-0.5 px-2 rounded-full">{count}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 mt-8">Difficulty</h3>
            <div className="flex gap-2 mb-4">
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
                <button
                  key={diff}
                  onClick={() => { setDifficultyFilter(diff as any); setSelectedTermId(null); }}
                  className={`px-3 py-1.5 rounded text-xs transition-colors border ${difficultyFilter === diff ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'}`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {recentlyViewed.length > 0 && (
              <>
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 mt-8">Recently Viewed</h3>
                <div className="space-y-1">
                  {recentlyViewed.map(id => {
                    const t = glossaryTerms.find(x => x.id === id);
                    if (!t) return null;
                    return (
                      <button 
                        key={id}
                        onClick={() => handleTermClick(id)}
                        className="w-full text-left px-3 py-1.5 text-sm text-neutral-400 hover:text-blue-400 hover:bg-blue-900/20 rounded truncate"
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-neutral-800 bg-neutral-900">
             <button onClick={() => {
                const randomTerm = glossaryTerms[Math.floor(Math.random() * glossaryTerms.length)];
                handleTermClick(randomTerm.id);
             }} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-sm rounded flex justify-center items-center gap-2 text-neutral-300 transition-colors">
               <Lightbulb className="w-4 h-4 text-yellow-500" /> Learn Something Random
             </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 relative custom-scrollbar">
          {!selectedTermId ? (
            // GRID VIEW
            <div className="p-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCategory === 'All' ? 'All Concepts' : selectedCategory}</h2>
                  <p className="text-neutral-400 text-sm mt-1">Showing {filteredTerms.length} terms</p>
                </div>
              </div>

              {filteredTerms.length === 0 ? (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-neutral-400 mb-2">No concepts found</h3>
                  <p className="text-neutral-500">Try searching for Bitmap, Selectivity, Compression, or Query.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTerms.map(term => (
                    <button 
                      key={term.id}
                      onClick={() => handleTermClick(term.id)}
                      className="text-left bg-neutral-900/50 border border-neutral-800 p-5 rounded-xl hover:bg-neutral-800 hover:border-neutral-700 transition-all group flex flex-col h-full"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(term.category)}
                          <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{term.name}</h3>
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-400 flex-1 leading-relaxed">{term.shortDefinition}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800/50">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getDifficultyColor(term.difficulty)}`}>
                          {term.difficulty}
                        </span>
                        <span className="text-blue-500 text-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // DETAIL VIEW
            <div className="max-w-4xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button 
                onClick={() => setSelectedTermId(null)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 text-sm group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Glossary
              </button>

              {selectedTerm && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                  {/* DETAIL HEADER */}
                  <div className="p-8 border-b border-neutral-800 bg-neutral-900/80">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                          {getCategoryIcon(selectedTerm.category)}
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-white">{selectedTerm.name}</h2>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-neutral-400 uppercase tracking-wider">{selectedTerm.category}</span>
                            <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getDifficultyColor(selectedTerm.difficulty)}`}>
                              {selectedTerm.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsBeginnerMode(true)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isBeginnerMode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                          Beginner
                        </button>
                        <button 
                          onClick={() => setIsBeginnerMode(false)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!isBeginnerMode ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
                        >
                          Technical
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg mt-6">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">In one sentence:</div>
                      <p className="text-blue-100 text-lg leading-relaxed">{selectedTerm.inOneSentence}</p>
                    </div>
                  </div>

                  {/* DETAIL BODY */}
                  <div className="p-8 space-y-10">
                    <section>
                      <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">What is it? & How does it work?</h3>
                      <p className="text-neutral-200 leading-relaxed text-lg">
                        {isBeginnerMode ? selectedTerm.beginnerExplanation : selectedTerm.technicalExplanation}
                      </p>
                    </section>

                    {renderInteractiveExample(selectedTerm)}

                    {selectedTerm.example && (
                      <section className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Example</h3>
                        <p className="font-mono text-sm text-emerald-400">{selectedTerm.example}</p>
                      </section>
                    )}

                    {selectedTerm.formula && (
                      <section className="bg-neutral-950 border border-neutral-800 p-5 rounded-lg">
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Formula</h3>
                        <p className="font-mono text-sm text-yellow-400">{selectedTerm.formula}</p>
                        <p className="text-xs text-neutral-500 mt-2">Conceptual educational formula</p>
                      </section>
                    )}

                    <section>
                      <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Why does it matter?</h3>
                      <p className="text-neutral-300 leading-relaxed bg-neutral-800/50 p-4 rounded border-l-4 border-blue-500">
                        {selectedTerm.whyItMatters}
                      </p>
                    </section>

                    {selectedTerm.commonConfusion && selectedTerm.commonConfusion.length > 0 && (
                      <section>
                        <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-3">Common Confusion</h3>
                        <div className="space-y-3">
                          {selectedTerm.commonConfusion.map((conf, idx) => (
                            <div key={idx} className="bg-rose-950/30 border border-rose-900/50 p-4 rounded">
                              <span className="font-bold text-rose-400 block mb-1">{selectedTerm.name} vs {conf.term}</span>
                              <p className="text-sm text-rose-200">{conf.distinction}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* VIVA MODE */}
                    <section className="pt-6 border-t border-neutral-800">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" /> Viva Preparation Mode
                        </h3>
                        <button 
                          onClick={() => setIsVivaMode(!isVivaMode)}
                          className={`text-xs px-3 py-1 rounded-full border ${isVivaMode ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'}`}
                        >
                          {isVivaMode ? 'Disable Viva Mode' : 'Enable Viva Mode'}
                        </button>
                      </div>
                      
                      {isVivaMode && selectedTerm.vivaQuestion && (
                        <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-lg animate-in fade-in slide-in-from-top-2">
                          <p className="text-emerald-400 font-bold mb-3">Q: {selectedTerm.vivaQuestion}</p>
                          <div className="bg-emerald-900/40 p-4 rounded text-emerald-100 text-sm leading-relaxed border-l-2 border-emerald-500">
                            A: {selectedTerm.vivaAnswer}
                          </div>
                        </div>
                      )}
                    </section>

                    {/* AI TUTOR INTEGRATION */}
                    <section className="bg-gradient-to-br from-indigo-950/40 to-blue-900/20 border border-indigo-500/30 p-6 rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                          <Sparkles className="w-4 h-4" /> Ask AI Tutor
                        </h3>
                        <button 
                          onClick={handleAskAi}
                          disabled={isAiLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                        >
                          {isAiLoading ? 'Thinking...' : 'Explain this'}
                        </button>
                      </div>
                      {aiExplanation && (
                        <div className="mt-4 p-4 bg-black/40 rounded border border-indigo-500/20 text-sm text-indigo-100 leading-relaxed whitespace-pre-wrap">
                          {aiExplanation}
                        </div>
                      )}
                      {!aiExplanation && (
                        <p className="text-sm text-indigo-300/60">
                          Ask the AI Tutor to explain {selectedTerm.name} dynamically using the current dataset and query configuration.
                        </p>
                      )}
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-neutral-800">
                      <div>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Related Concepts</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTerm.relatedTerms.map(rt => {
                            const termObj = glossaryTerms.find(t => t.id === rt);
                            if (!termObj) return null;
                            return (
                              <button 
                                key={rt}
                                onClick={() => handleTermClick(rt)}
                                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded text-xs transition-colors"
                              >
                                {termObj.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Where You'll See This</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTerm.usedIn.map(tab => (
                            <span key={tab} className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                              <CheckCircle2 className="w-3 h-3" /> {tab}
                            </span>
                          ))}
                        </div>
                        {selectedTerm.route && onNavigateToTab && (
                           <button 
                             onClick={() => {
                               onNavigateToTab(selectedTerm.route!);
                               onClose();
                             }}
                             className="mt-4 text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors"
                           >
                             Open {selectedTerm.route} Tab →
                           </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
