import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface GlossaryProps {
  isOpen: boolean;
  onClose: () => void;
}

const terms = [
  { term: "Bitmap Index", def: "A database index that uses bit arrays (bitmaps) to answer queries. Excellent for low-cardinality data." },
  { term: "Cardinality", def: "The number of distinct, unique values in a column. Gender = Low Cardinality (2-3). Social Security Number = High Cardinality (Millions)." },
  { term: "Density", def: "The percentage of bits in a bitmap that are set to 1. Sparse bitmaps are mostly 0s, dense bitmaps have many 1s." },
  { term: "Selectivity", def: "A measure of how effectively a predicate filters a table. Highly selective queries return very few rows." },
  { term: "Run-Length Encoding (RLE)", def: "A compression algorithm that stores sequences of identical bits (runs) as a single value and count." },
  { term: "B-Tree Index", def: "The default database index type. Uses a balanced tree structure. Great for high-cardinality exact matches and ranges." },
  { term: "Heap Table Fetch", def: "The physical process of the database reading the actual row data from disk after finding the Row ID in an index." },
  { term: "Bitwise AND", def: "A mathematical operation where the result is 1 only if BOTH input bits are 1. Used to combine multiple WHERE conditions." }
];

export function Glossary({ isOpen, onClose }: GlossaryProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col transform transition-transform">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <BookOpen className="w-5 h-5 text-blue-400" /> Educational Glossary
        </h2>
        <button 
          onClick={onClose}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {terms.map((t, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-sm font-bold text-blue-300">{t.term}</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">{t.def}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
