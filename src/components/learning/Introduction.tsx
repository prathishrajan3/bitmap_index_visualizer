import React from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Video, 
  Globe, 
  FileText, 
  Database, 
  Cpu, 
  Zap, 
  History, 
  ExternalLink, 
  Layers, 
  Binary, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export function Introduction() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-neutral-900/80 via-neutral-900/40 to-blue-950/20 border border-neutral-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-blue-500" />
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Binary className="w-8 h-8 text-blue-400" />
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Database Index Theory
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Foundational Database Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                OLAP & Star Schema
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Introduction to Bitmap Indexes
            </h1>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-3xl mt-2">
              A <strong>bitmap index</strong> is a specialized database indexing technique that represents attribute values as arrays of individual bits (bitmaps). Queries are evaluated by performing direct bitwise Boolean operations (AND, OR, NOT, XOR), delivering orders-of-magnitude faster filtering on low-cardinality attributes compared to traditional B-Tree scans.
            </p>
          </div>
        </div>
      </div>

      {/* Wikipedia Canonical Example */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <h2 className="text-xl font-bold text-white">Canonical Example: Logical Structure</h2>
          </div>
          <span className="text-xs text-neutral-500 font-mono">Binary Vector Mapping</span>
        </div>

        <p className="text-neutral-300 text-sm leading-relaxed">
          Consider a resident dataset recording internet connectivity. The column <code className="text-blue-300 bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-xs">HasInternet</code> has low cardinality with two possible affirmative/negative states. A traditional index would store lists of row IDs (RIDs), whereas a bitmap index stores two parallel bit vectors:
        </p>

        {/* Visual Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="overflow-x-auto border border-neutral-800 rounded-lg bg-neutral-950/70">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800">
                  <th className="py-2.5 px-4 border-r border-neutral-800/60">Row Identifier</th>
                  <th className="py-2.5 px-4 border-r border-neutral-800/60">HasInternet</th>
                  <th className="py-2.5 px-4 text-center bg-blue-950/30 text-blue-300 border-r border-neutral-800/60">Bitmap Y</th>
                  <th className="py-2.5 px-4 text-center bg-purple-950/30 text-purple-300">Bitmap N</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/40">
                <tr className="hover:bg-neutral-900/30">
                  <td className="py-2 px-4 text-neutral-400 border-r border-neutral-800/40">Row 1</td>
                  <td className="py-2 px-4 text-emerald-400 font-sans font-medium border-r border-neutral-800/40">Yes</td>
                  <td className="py-2 px-4 text-center font-bold text-blue-400 bg-blue-500/10 border-r border-neutral-800/40">1</td>
                  <td className="py-2 px-4 text-center text-neutral-600">0</td>
                </tr>
                <tr className="hover:bg-neutral-900/30">
                  <td className="py-2 px-4 text-neutral-400 border-r border-neutral-800/40">Row 2</td>
                  <td className="py-2 px-4 text-rose-400 font-sans font-medium border-r border-neutral-800/40">No</td>
                  <td className="py-2 px-4 text-center text-neutral-600 border-r border-neutral-800/40">0</td>
                  <td className="py-2 px-4 text-center font-bold text-purple-400 bg-purple-500/10">1</td>
                </tr>
                <tr className="hover:bg-neutral-900/30">
                  <td className="py-2 px-4 text-neutral-400 border-r border-neutral-800/40">Row 3</td>
                  <td className="py-2 px-4 text-rose-400 font-sans font-medium border-r border-neutral-800/40">No</td>
                  <td className="py-2 px-4 text-center text-neutral-600 border-r border-neutral-800/40">0</td>
                  <td className="py-2 px-4 text-center font-bold text-purple-400 bg-purple-500/10">1</td>
                </tr>
                <tr className="hover:bg-neutral-900/30">
                  <td className="py-2 px-4 text-neutral-400 border-r border-neutral-800/40">Row 4</td>
                  <td className="py-2 px-4 text-neutral-500 font-sans border-r border-neutral-800/40">Unspecified</td>
                  <td className="py-2 px-4 text-center text-neutral-600 border-r border-neutral-800/40">0</td>
                  <td className="py-2 px-4 text-center text-neutral-600">0</td>
                </tr>
                <tr className="hover:bg-neutral-900/30">
                  <td className="py-2 px-4 text-neutral-400 border-r border-neutral-800/40">Row 5</td>
                  <td className="py-2 px-4 text-emerald-400 font-sans font-medium border-r border-neutral-800/40">Yes</td>
                  <td className="py-2 px-4 text-center font-bold text-blue-400 bg-blue-500/10 border-r border-neutral-800/40">1</td>
                  <td className="py-2 px-4 text-center text-neutral-600">0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-4 text-sm text-neutral-300 bg-neutral-950/40 p-5 rounded-lg border border-neutral-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              How Bitwise Queries Execute
            </h3>
            <p className="text-xs leading-relaxed text-neutral-400">
              When querying <code className="text-emerald-300 font-mono">WHERE HasInternet = 'Yes'</code>, the database engine does not iterate row-by-row. It simply fetches <code className="text-blue-300 font-mono">Bitmap Y</code> (<span className="text-white font-mono font-bold">10001</span>).
            </p>
            <p className="text-xs leading-relaxed text-neutral-400">
              For compound predicates like <code className="text-emerald-300 font-mono">WHERE HasInternet = 'Yes' AND Region = 'North'</code>, the engine performs a hardware-level <strong className="text-white font-mono">AND</strong> instruction between the two bitmaps:
            </p>
            <div className="font-mono text-xs bg-neutral-900 p-3 rounded border border-neutral-800 text-neutral-300 space-y-1">
              <div>Bitmap Y (Internet) : <span className="text-blue-400">1 0 0 0 1</span></div>
              <div>Bitmap N (Region)   : <span className="text-purple-400">1 1 0 0 0</span></div>
              <div className="border-t border-neutral-700 pt-1 text-emerald-400 font-bold">
                Bitwise AND Result   : 1 0 0 0 0  → Match Row #1
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Advantages vs B-Trees (OLAP vs OLTP) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <h3>Key Advantages (OLAP & Warehousing)</h3>
          </div>
          <ul className="space-y-3 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span><strong>Hardware Bitwise Speed:</strong> Modern 64-bit CPUs process 64 rows in a single clock cycle, or 512 rows per instruction using SIMD AVX-512 extensions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span><strong>Multi-Index Combination:</strong> Arbitrary boolean filters (AND, OR, NOT, XOR) can be combined efficiently without requiring exponential multi-column composite indexes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold mt-0.5">•</span>
              <span><strong>Star Schema Join Acceleration:</strong> Widely employed in data warehouses to join massive central fact tables against smaller dimension tables via bitmap semi-joins.</span>
            </li>
          </ul>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-lg">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3>Drawbacks & Limitations (OLTP Systems)</h3>
          </div>
          <ul className="space-y-3 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <span><strong>Unsuitable for Frequent Updates:</strong> Modifying a single value locks or invalidates the entire bitmap column vector for that value, causing concurrency bottlenecks in OLTP transactions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <span><strong>High Cardinality Sparsity:</strong> For attributes with millions of unique values (e.g., Primary Keys, timestamps), uncompressed bitmaps become predominantly zeros, demanding compression or binning.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <span><strong>Best for Read-Only / Append-Heavy:</strong> Consequently, bitmap indexes are standard in read-heavy analytics, analytical marts, and decision-support databases.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Wikipedia Technical Pillars: Compression, Encoding, Binning */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Three Architectural Variations
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Modern database engines employ three core design strategies to handle large scales and high-cardinality attributes:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. Compression */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs mb-3 border border-blue-500/20">
                01
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Bitmap Compression</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Bitmaps are compressed using specialized run-length encoding methods: <strong>WAH (Word-Aligned Hybrid)</strong>, <strong>BBC (Byte-aligned Bitmap Code)</strong>, <strong>EWAH</strong>, <strong>PLWAH</strong>, and <strong>Roaring Bitmaps</strong>.
              </p>
              <div className="mt-3 p-2.5 rounded bg-neutral-900 border border-neutral-800/60 text-[11px] text-neutral-300">
                <strong className="text-blue-300 block mb-1">Key Breakthrough:</strong>
                WAH, BBC, and Roaring bitmaps allow logical operations (AND, OR) to run <em>directly on compressed data without decompression</em>, performing 12× faster than legacy formats.
              </div>
            </div>
            <div className="mt-4 text-[11px] text-neutral-500 font-mono">
              Lexicographical row sorting can reduce index size by up to 9×.
            </div>
          </div>

          {/* 2. Encoding */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs mb-3 border border-purple-500/20">
                02
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Encoding Schemes</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Standard equality indexes assign 1 bitmap per distinct value (<span className="text-neutral-300 font-mono">C</span> bitmaps). Alternate encodings reduce this:
              </p>
              <div className="mt-3 p-2.5 rounded bg-neutral-900 border border-neutral-800/60 text-[11px] text-neutral-300">
                <strong className="text-purple-300 block mb-1">Binary & Multi-Component:</strong>
                Binary encoding represents <span className="font-mono">C</span> values using only <span className="font-mono">log₂(C)</span> bitmaps. Chan & Ioannidis (ACM SIGMOD) proved that <em>two-component encoding</em> sits at the optimal trade-off between index size and query speed.
              </div>
            </div>
            <div className="mt-4 text-[11px] text-neutral-500 font-mono">
              Enables bit-sliced arithmetic for range calculations.
            </div>
          </div>

          {/* 3. Binning */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs mb-3 border border-emerald-500/20">
                03
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Binning & Candidate Checks</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                For continuous or high-cardinality numerical data, values are partitioned into discrete bins (e.g., [0.0–1.0], [1.0–2.0]).
              </p>
              <div className="mt-3 p-2.5 rounded bg-neutral-900 border border-neutral-800/60 text-[11px] text-neutral-300">
                <strong className="text-emerald-300 block mb-1">Candidate Check Phase:</strong>
                Bins filter out vast swaths of non-matching rows. For boundary values, the database performs a fast "candidate check" on base rows to verify exact match conditions.
              </div>
            </div>
            <div className="mt-4 text-[11px] text-neutral-500 font-mono">
              Drastically shrinks index footprints on continuous metrics.
            </div>
          </div>
        </div>
      </div>

      {/* In-Memory Bitmaps & PostgreSQL Optimization */}
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          In-Memory Bitmaps & PostgreSQL "Bitmap Index Scans"
        </h2>
        <p className="text-neutral-300 text-sm leading-relaxed">
          Many enterprise databases that do not store persistent on-disk bitmap indexes still utilize <strong>transient in-memory bitmaps</strong> to accelerate queries.
        </p>
        <p className="text-neutral-400 text-sm leading-relaxed">
          For example, <strong>PostgreSQL (v8.1+)</strong> implements dynamic <em>Bitmap Index Scans</em>. If a query has conditions on multiple separate columns (each indexed with a normal B-Tree), PostgreSQL builds temporary in-memory bit-arrays for each index result, combines them with bitwise AND/OR, and retrieves only the matching disk pages in strict sequential physical order. This eliminates random disk I/O and avoids the exponential need for multi-column composite B-Tree indexes!
        </p>
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-neutral-500">Minimal index combination formula:</span>{' '}
            <span className="text-amber-400 font-bold">C(n, ⌊n/2⌋) = n! / ((n - ⌊n/2⌋)! · ⌊n/2⌋!)</span>
          </div>
          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
            Bitmap scans reduce this to only 1 single index per column
          </span>
        </div>
      </div>

      {/* Historical Milestones */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-4">
          <History className="w-5 h-5 text-blue-400" />
          Historical Timeline & Industry Milestones
        </h2>

        <div className="relative border-l border-neutral-800 ml-3 pl-6 space-y-6">
          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-neutral-950" />
            <span className="text-xs font-mono text-blue-400 font-bold">1985</span>
            <h3 className="text-sm font-semibold text-white">Introduction of the Binary Index Concept</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Prof. Israel Spiegler and Rafi Maayan published <em>"Storage and Retrieval Considerations of Binary Data Bases"</em>, formally introducing bit arrays as primary index structures.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-neutral-950" />
            <span className="text-xs font-mono text-purple-400 font-bold">1987</span>
            <h3 className="text-sm font-semibold text-white">First Commercial Implementation: Model 204</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Patrick O'Neil published the architecture of Computer Corporation of America's <strong>Model 204</strong>, the first commercial database engine implementing bitmap indexing as a hybrid B+tree / RID-list structure.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
            <span className="text-xs font-mono text-emerald-400 font-bold">1998 – 2004</span>
            <h3 className="text-sm font-semibold text-white">WAH & Optimal Multi-Component Encoding</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Chan & Ioannidis formulated multi-component encoding models (ACM SIGMOD), and Kesheng John Wu (Lawrence Berkeley National Laboratory) developed <strong>FastBit</strong> and Word-Aligned Hybrid (WAH) compression.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-neutral-950" />
            <span className="text-xs font-mono text-amber-400 font-bold">Modern Era</span>
            <h3 className="text-sm font-semibold text-white">Roaring Bitmaps & Cloud Data Warehousing</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Daniel Lemire introduced <strong>Roaring Bitmaps</strong> (widely adopted in Apache Lucene, Spark, Hive, and ClickHouse). Cloud analytical platforms rely on bit-sliced columnar indexing to handle multi-petabyte analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive Academic References & Acknowledgements */}
      <div className="mt-12 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            Acknowledgements & Foundational References
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            This laboratory's design, Boolean engine, and benchmarks are developed in accordance with the following seminal papers, textbooks, and engineering resources:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Research Papers */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="text-base font-semibold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Seminal Research Papers
            </h3>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li>
                <strong className="text-neutral-200 block text-sm">Storage and retrieval considerations of binary data bases (1985)</strong>
                Israel Spiegler, Rafi Maayan — <em>Information Processing & Management, 21(3): 233–254</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Model 204 Architecture and Performance (1987)</strong>
                Patrick O'Neil — <em>High Performance Transaction Systems, Springer-Verlag, pp. 40–59</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Bitmap index design and evaluation (1998)</strong>
                Chee-Yong Chan, Yannis E. Ioannidis — <em>ACM SIGMOD International Conference on Management of Data</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Better bitmap performance with Roaring bitmaps (2016)</strong>
                Samy Chambi, Daniel Lemire, Owen Kaser, Robert Godin — <em>Software: Practice and Experience, 46(5): 709–719</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">On the performance of bitmap indices for high cardinality attributes (2004)</strong>
                Kesheng John Wu, Ekow J. Otoo, Arie Shoshani — <em>Lawrence Berkeley National Laboratory</em>.
              </li>
            </ul>
          </div>

          {/* Reference Articles & Web Documentation */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="text-base font-semibold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Websites & Authoritative Documentation
            </h3>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800/60">
                <div className="flex items-center justify-between">
                  <strong className="text-blue-300 text-sm">Wikipedia: Bitmap Index</strong>
                  <a 
                    href="https://en.wikipedia.org/wiki/Bitmap_index" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 text-xs"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-neutral-500 text-[11px] mt-1">
                  Comprehensive encyclopedia article detailing historical context, WAH compression, binning, and in-memory bitmap index scans.
                </p>
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Oracle Database Concepts: Bitmap Indexes</strong>
                Official architecture documentation on cardinality thresholds, star queries, and warehouse fact joins.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">PostgreSQL Documentation: Bitmap Index Scans</strong>
                Internal mechanics of in-memory lossy and lossless bitmap index scans (v8.1+).
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">FastBit C++ Software Library (LBNL)</strong>
                John Wu (2007) — Annotated References on Bitmap Index and Word-Aligned Hybrid coding.
              </li>
            </ul>
          </div>

          {/* Books */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="text-base font-semibold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Standard Textbooks
            </h3>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li>
                <strong className="text-neutral-200 block text-sm">Database System Concepts (7th Edition)</strong>
                Abraham Silberschatz, Henry F. Korth, S. Sudarshan — <em>Chapter on Indexing and Hashing</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Database Principles, Programming, and Performance (2nd Edition)</strong>
                Patrick O'Neil, Elizabeth O'Neil — <em>Morgan Kaufmann Publishers</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">Database Management Systems (3rd Edition)</strong>
                Raghu Ramakrishnan, Johannes Gehrke.
              </li>
            </ul>
          </div>

          {/* Video Lectures & Courses */}
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="text-base font-semibold text-neutral-200 flex items-center gap-2 border-b border-neutral-800 pb-2">
              <GraduationCap className="w-4 h-4 text-orange-400" />
              Educational Lectures & Courses
            </h3>
            <ul className="space-y-3 text-xs text-neutral-400">
              <li>
                <strong className="text-neutral-200 block text-sm">CMU 15-445/645: Intro to Database Systems</strong>
                Prof. Andy Pavlo (Carnegie Mellon University) — <em>Lectures on Indexing Types & Bitmap Encoding</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">University of Southampton: Advanced Databases</strong>
                S. O'Connell (2005) — <em>Course notes on Bit-Sliced Arithmetic & Multi-Index Query Evaluation</em>.
              </li>
              <li>
                <strong className="text-neutral-200 block text-sm">YouTube: CMU Database Systems Lecture Series</strong>
                In-depth video analysis on SIMD bitwise processing and columnar compression.
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
