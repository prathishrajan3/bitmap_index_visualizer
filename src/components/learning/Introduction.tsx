import React from 'react';
import { BookOpen, GraduationCap, Video, Globe, FileText, Database } from 'lucide-react';

export function Introduction() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 flex items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-blue-500" />
        </div>
        
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/20">
          <BookOpen className="w-8 h-8 text-blue-400" />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Introduction to Bitmap Indexes</h1>
          <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl">
            A bitmap index is a specialized database index that uses bitmaps (bit arrays) to answer queries. 
            They are highly space-efficient and extremely fast for certain types of queries, particularly those 
            involving multiple low-cardinality columns (like gender, boolean flags, or finite categories).
          </p>
        </div>
      </div>

      {/* Core Concept */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-200 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            How it Works
          </h2>
          <p className="text-neutral-400 leading-relaxed mb-4">
            Instead of storing a list of row IDs for each value (like a traditional B-Tree), a bitmap index 
            creates an array of bits for every distinct value. Each bit corresponds to a row in the table.
          </p>
          <ul className="list-disc list-inside text-neutral-400 space-y-2 ml-2">
            <li>If the row has that value, the bit is set to <strong className="text-emerald-400">1</strong></li>
            <li>If it does not, the bit is <strong className="text-neutral-500">0</strong></li>
          </ul>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-200 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            Why they are Fast
          </h2>
          <p className="text-neutral-400 leading-relaxed">
            CPUs are incredibly efficient at processing bitwise operations (AND, OR, NOT). 
            When you run a complex query like <code className="bg-neutral-800 px-1 rounded text-sm text-neutral-300">WHERE Dept='Sales' AND Active=true</code>, 
            the database simply takes the two bitmaps and performs a lightning-fast bitwise AND operation across millions of rows simultaneously.
          </p>
        </div>
      </div>

      {/* Acknowledgements and References */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-neutral-800 pb-4">
          Acknowledgements & References
        </h2>
        <p className="text-neutral-400 mb-8">
          The development of this laboratory and the underlying engine was guided by the following foundational resources in database engineering.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Books */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Books
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <strong className="text-neutral-300 block">Database System Concepts (7th Edition)</strong>
                Abraham Silberschatz, Henry F. Korth, S. Sudarshan
              </li>
              <li>
                <strong className="text-neutral-300 block">Database Management Systems (3rd Edition)</strong>
                Raghu Ramakrishnan, Johannes Gehrke
              </li>
            </ul>
          </div>

          {/* Research Papers */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Research Papers
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <strong className="text-neutral-300 block">Bitmap Index Design and Evaluation</strong>
                Chee-Yong Chan, Yannis E. Ioannidis (ACM SIGMOD)
              </li>
              <li>
                <strong className="text-neutral-300 block">Better bitmap performance with Roaring bitmaps</strong>
                Samy Chambi, Daniel Lemire, et al.
              </li>
            </ul>
          </div>

          {/* Websites & Documentation */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Websites & Documentation
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <strong className="text-neutral-300 block">Oracle Database Concepts Glossary</strong>
                Guidelines on Bitmap Index cardinality and usage.
              </li>
              <li>
                <strong className="text-neutral-300 block">PostgreSQL Documentation</strong>
                Internal discussions and extensions on bit-string processing.
              </li>
            </ul>
          </div>

          {/* Educational Resources & Videos */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-neutral-200 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-orange-400" />
              <Video className="w-4 h-4 text-orange-400 ml-1" />
              Educational Resources & Videos
            </h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <strong className="text-neutral-300 block">CMU 15-445/645: Intro to Database Systems</strong>
                Prof. Andy Pavlo (Carnegie Mellon University) - Lectures on Indexing.
              </li>
              <li>
                <strong className="text-neutral-300 block">YouTube: CMU Database Systems - Bitmap Indexes</strong>
                Video lectures covering core bitmap concepts and encoding strategies.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
