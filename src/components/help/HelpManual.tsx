import React from 'react';
import { HelpCircle, Database, Settings2, Sparkles, Blocks, Calculator, Terminal, GitCompare, Table2 } from 'lucide-react';

export function HelpManual() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-4">
      {/* Header */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <HelpCircle className="w-32 h-32 text-blue-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-blue-400" />
          User Manual
        </h1>
        <p className="text-neutral-400 text-lg">
          A step-by-step guide to operating the Bitmap Index Laboratory.
        </p>
      </div>

      {/* 1. Overview */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-200 mb-4 text-blue-400">1. What this Application Does</h2>
        <p className="text-neutral-400 leading-relaxed mb-4">
          The <strong>Bitmap Index Laboratory</strong> is an interactive educational tool that simulates how modern databases process data under the hood. It allows you to generate datasets, physically construct bit-arrays (bitmap indexes) for the data, perform raw Boolean algebra on those bits, and execute SQL queries to see the massive performance benefits of bitmap indexing over traditional table scans.
        </p>
      </div>

      {/* 2. Inputs & Settings */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-200 mb-4 text-blue-400">2. Global Settings & Inputs</h2>
        <p className="text-neutral-400 mb-6">Found on the left sidebar, these controls dictate the shape and size of your dataset.</p>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <Settings2 className="w-6 h-6 text-neutral-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-200 mb-1">Row Count & Random Seed</h3>
              <p className="text-neutral-400 text-sm">
                <strong>Row Count:</strong> Drag the slider to set how many rows (records) to generate.<br/>
                <strong>Random Seed:</strong> Enter any number. Using the same seed guarantees the exact same dataset is generated every time.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Database className="w-6 h-6 text-neutral-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-200 mb-1">Column Definitions</h3>
              <p className="text-neutral-400 text-sm mb-2">Define the structure of your table. You can add new columns, rename them, or delete them.</p>
              <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1 ml-2">
                <li><strong>Cardinality:</strong> The number of distinct unique values the column can have (e.g., Cardinality 2 for a "Gender" column).</li>
                <li><strong>Distribution:</strong> How the data is spread out. <em>Uniform</em> spreads values evenly, <em>Random</em> assigns them unpredictably, and <em>Cyclic</em> repeats them in order.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-200 mb-4 text-blue-400">3. Generating Data (Buttons)</h2>
        <p className="text-neutral-400 mb-4 text-sm">Once your settings are configured, use the buttons at the bottom of the sidebar:</p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-sm text-neutral-400">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span><strong>Generate with AI:</strong> Give the AI a custom context (e.g., "Hospital Patient Records") and it will intelligently populate the column names and data.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-neutral-400">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold shrink-0 text-xs">R</div>
            <span><strong>Regenerate Data:</strong> Instantly creates a new simulated dataset locally using your exact Column Definitions and Seed.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-neutral-400">
            <div className="w-5 h-5 bg-neutral-700 rounded flex items-center justify-center text-white shrink-0">↑</div>
            <span><strong>Upload CSV:</strong> Import your own custom dataset file directly into the laboratory.</span>
          </li>
        </ul>
      </div>

      {/* 4. Tab Navigation Workflow */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-neutral-200 mb-4 text-blue-400">4. Processing & Interpreting Output</h2>
        <p className="text-neutral-400 mb-6">Navigate through the top tabs in order from left to right to process the data.</p>
        
        <div className="space-y-4">
          <div className="border border-neutral-800 rounded p-4 flex gap-4 bg-neutral-900/50">
            <Table2 className="w-6 h-6 text-blue-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-200">Dataset Tab</h3>
              <p className="text-sm text-neutral-400">View the raw tabular data that was generated or uploaded. This is the "before" state.</p>
            </div>
          </div>

          <div className="border border-neutral-800 rounded p-4 flex gap-4 bg-neutral-900/50">
            <Blocks className="w-6 h-6 text-purple-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-200">Builder Tab (Crucial Step)</h3>
              <p className="text-sm text-neutral-400">Click <strong>Build Bitmap Indexes</strong>. The engine will scan your dataset and generate an array of bits (1s and 0s) for every unique value in every column.</p>
            </div>
          </div>

          <div className="border border-neutral-800 rounded p-4 flex gap-4 bg-neutral-900/50">
            <Calculator className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-200">Matrix & Algebra Tabs</h3>
              <p className="text-sm text-neutral-400"><strong>Matrix:</strong> Visually inspect the generated bits.<br/><strong>Algebra:</strong> Perform raw bitwise operations (AND, OR, NOT) between different attributes to see how the database filters data mathematically.</p>
            </div>
          </div>

          <div className="border border-neutral-800 rounded p-4 flex gap-4 bg-neutral-900/50">
            <Terminal className="w-6 h-6 text-orange-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-200">Neon Query Tab</h3>
              <p className="text-sm text-neutral-400">Write an SQL query or ask a natural language question. The engine will parse your query into an Abstract Syntax Tree (AST), convert it into bitwise operations, and execute it against your bitmaps in real-time.</p>
            </div>
          </div>

          <div className="border border-neutral-800 rounded p-4 flex gap-4 bg-neutral-900/50">
            <GitCompare className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h3 className="font-semibold text-neutral-200">Compare Tab</h3>
              <p className="text-sm text-neutral-400">Run a benchmark test comparing a standard Row-by-Row Table Scan against the Bitmap Index logic to see the speedup multiplier.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
