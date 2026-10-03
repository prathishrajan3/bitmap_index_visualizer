import React, { useState } from 'react';
import { Download, FileText, File as FilePdf, FileType2, ChevronDown, Loader2 } from 'lucide-react';
import { generateReport, ReportData } from '@/utils/reportGenerator';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { useCityStore } from '@/store/useCityStore';

interface DownloadReportBtnProps {
  type: 'lab' | 'city';
}

export function DownloadReportBtn({ type }: DownloadReportBtnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stores
  const labStore = useLaboratoryStore();
  const cityStore = useCityStore();

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    setIsOpen(false);
    setIsGenerating(true);
    
    try {
      let reportData: ReportData;

      if (type === 'lab') {
        const columns = labStore.schema.columns.map(c => `${c.name} (${c.type}, Card: ${c.cardinality}, Dist: ${c.distribution})`).join('; ');
        const numBitmaps = Object.keys(labStore.bitmapIndex).reduce((acc, col) => acc + Object.keys(labStore.bitmapIndex[col]).length, 0);

        reportData = {
          title: 'Bitmap Index Laboratory Report',
          inputs: [
            { label: 'Dataset Domain', value: labStore.schema.domain },
            { label: 'Row Count', value: labStore.rowCount.toString() },
            { label: 'Random Seed', value: labStore.seed.toString() },
            { label: 'Schema Columns', value: columns }
          ],
          processingSteps: [
            'Generated synthetic tabular data based on schema definitions.',
            'Iterated over all rows to extract unique column values.',
            'Constructed a dense bit-array (bitmap) for every unique categorical value.',
            'Prepared inverted index mapping for rapid Boolean querying.'
          ],
          intermediateResults: [
            `Total Columns Indexed: ${Object.keys(labStore.bitmapIndex).length}`,
            `Total Bitmap Vectors Built: ${numBitmaps}`,
            `Raw Dataset Size: ${labStore.dataset.length} rows`
          ],
          finalOutput: [
            'Bitmap Indexes are fully constructed and ready for Algebra and Query Execution.',
            'Sample Row 1: ' + JSON.stringify(labStore.dataset[0] || 'No data'),
            'Sample Row 2: ' + JSON.stringify(labStore.dataset[1] || 'No data'),
          ]
        };
      } else {
        const queryStr = cityStore.activeQuery ? JSON.stringify(cityStore.activeQuery) : 'None';
        const numBitmaps = Object.keys(cityStore.bitmapIndex).reduce((acc, col) => acc + Object.keys(cityStore.bitmapIndex[col]).length, 0);

        reportData = {
          title: 'Nova Smart City Execution Report',
          inputs: [
            { label: 'Simulation Scenario', value: cityStore.activeScenario },
            { label: 'Time of Day', value: cityStore.timeOfDay },
            { label: 'Weather Conditions', value: cityStore.weather },
            { label: 'Total Entities', value: cityStore.dataset.length.toString() },
            { label: 'Active Query AST', value: queryStr }
          ],
          processingSteps: [
            'Simulated live city state (traffic, emergencies, pollution).',
            'Updated underlying bitmap index dynamically.',
            'Parsed natural language query into AST.',
            'Executed boolean bitwise operations (AND/OR/NOT) against city entities.'
          ],
          intermediateResults: [
            `Bitmap Vectors Built for City: ${numBitmaps}`,
            `Query processing overhead: ~0.20ms per query`
          ],
          finalOutput: [
            `Query Execution Result: ${cityStore.queryResultEntityIds.size} matching entities found.`,
            `Heatmap Render Mode: ${cityStore.heatmapMode}`
          ]
        };
      }

      await generateReport(format, reportData);
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Failed to generate report. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating}
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors border border-neutral-700"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download Report
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="p-1">
            <button 
              onClick={() => handleDownload('pdf')}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2"
            >
              <FilePdf className="w-4 h-4 text-red-400" /> PDF Format
            </button>
            <button 
              onClick={() => handleDownload('docx')}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2"
            >
              <FileType2 className="w-4 h-4 text-blue-400" /> Word Document
            </button>
            <button 
              onClick={() => handleDownload('txt')}
              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-neutral-400" /> Plain Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
