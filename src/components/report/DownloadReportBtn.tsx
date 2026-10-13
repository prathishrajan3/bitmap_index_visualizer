import React, { useState } from 'react';
import { Download, FileText, File as FilePdf, FileType2, ChevronDown, Loader2 } from 'lucide-react';
import { generateReport } from '@/utils/reportGenerator';
import { buildLaboratoryReportPayload, buildCityReportPayload } from '@/utils/reportDataBuilder';
import { useLaboratoryStore } from '@/store/useLaboratoryStore';
import { useLearningStore } from '@/store/useLearningStore';
import { useCityStore } from '@/store/useCityStore';

interface DownloadReportBtnProps {
  type: 'lab' | 'city';
}

export function DownloadReportBtn({ type }: DownloadReportBtnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stores
  const labStore = useLaboratoryStore();
  const learningStore = useLearningStore();
  const cityStore = useCityStore();

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    setIsOpen(false);
    setIsGenerating(true);
    
    try {
      const reportPayload = type === 'lab'
        ? buildLaboratoryReportPayload(labStore, learningStore)
        : buildCityReportPayload(cityStore);

      await generateReport(format, reportPayload);
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
        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors border border-neutral-700 disabled:opacity-50"
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span>Download Report</span>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="p-1">
            <button 
              onClick={() => handleDownload('pdf')}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2 transition-colors font-medium"
            >
              <FilePdf className="w-4 h-4 text-rose-400 shrink-0" />
              <span>PDF Technical Report</span>
            </button>
            <button 
              onClick={() => handleDownload('docx')}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2 transition-colors font-medium"
            >
              <FileType2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Word Document (.docx)</span>
            </button>
            <button 
              onClick={() => handleDownload('txt')}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white rounded flex items-center gap-2 transition-colors font-medium"
            >
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Plain Text Summary (.txt)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
