# Bitmap Index Visualizer & Nova City Digital Twin

[![Live Demo](https://img.shields.io/badge/Live_Demo-bitmapindex.vercel.app-emerald?style=for-the-badge&logo=vercel)](https://bitmapindex.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

> An interactive, high-performance web platform designed to explore, benchmark, and visualize the inner workings of **Bitmap Indexing** — from fundamental bitwise vector arithmetic and compression algorithms to a live **Smart City Digital Twin** running real-time analytical queries over thousands of entities.

🔗 **Live Application:** [https://bitmapindex.vercel.app](https://bitmapindex.vercel.app)

---

## 📌 Project Overview

In read-heavy relational databases, data warehousing, and Online Analytical Processing (OLAP) environments, traditional B-Tree indexes struggle when filtering across multi-column, low-cardinality attributes (such as status, district, severity, or boolean flags). **Bitmap Indexing** solves this bottleneck by representing distinct column values as compact binary bit vectors (bitmaps), enabling multi-attribute filtering through ultra-fast, hardware-accelerated bitwise logic (`AND`, `OR`, `NOT`).

This project serves as an educational laboratory and practical demonstration engine, breaking down theoretical database systems concepts into clear visual models, real-time query executions, comparative performance benchmarks, and a rich smart city simulation.

---

## 🧪 1. The Bitmap Index Laboratory (Visualizer)

The core visualizer provides an interactive, hands-on environment to inspect and understand bitmap indexing:

- **Interactive Dataset Generator:** Synthesize custom datasets with configurable row counts (10 to 1,000+ records), multiple attributes, and low vs. high cardinality distributions.
- **Bit Vector Construction:** Visualize step-by-step how raw database records are transposed into distinct bit arrays and vector matrices.
- **Bitwise Query Execution:** Formulate multi-condition SQL and Boolean queries (`AND`, `OR`, `NOT`). Watch how individual bit vectors are intersected or unioned bit-by-bit in real time to produce exact result sets in sub-millisecond execution times.
- **Compression Algorithms:** Inspect how sparse and dense bit vectors are compressed using industry-standard techniques:
  - **RLE** (Run-Length Encoding)
  - **WAH** (Word-Aligned Hybrid compression)
  - **Roaring Bitmaps** (hybrid chunk-based container structure)
- **Comparative Benchmark Suite:** Real-time side-by-side performance comparison of **Bitmap Index vs. B-Tree vs. Sequential Scan** measuring query execution time, memory footprints, and indexing overhead across varying cardinalities.
- **Interactive Knowledge Assessment:** Built-in quiz system featuring a pool of 50+ conceptual AI questions and 50+ previous year exam questions (PYQs) on bitmap indexes with explanations.
- **Analytical Report Generator:** Comprehensive analytical reports summarizing query metrics, compression ratios, and performance comparisons.

---

## 🏙️ 2. Nova City: Smart City Digital Twin

**Nova City** is a real-time geospatial simulation that demonstrates bitmap indexing at scale in modern Internet of Things (IoT) and urban analytics systems:

- **2,000 Live Entities Across 10 Districts:** Simulates vehicles, hospitals, traffic intersections, power substations, and sensors across districts (Central Business District, Tech Park, Riverside, etc.).
- **Dynamic Environmental Conditions & Incident Simulation:** Trigger dynamic scenarios on the fly — *Morning, Night, Rush Hour, Heavy Rain, Major Accident, Pollution Spikes, and Multi-Crisis*.
- **Natural Language Smart Query Engine:** Describe what you want to find in plain English (e.g., *"Find all critical hospitals with severe traffic nearby"* or *"Locate active accident zones in commercial areas"*). The engine translates queries into bitmap index vector operations.
- **Sub-Millisecond Vector Filtering:** Evaluates complex multi-attribute queries across thousands of records in under 1 millisecond.
- **Radiant Geospatial Visualization:** Real-time canvas highlighting matching entities, district telemetry, and emergency hot-spots on a futuristic cybernetic city map.

---

## 🚀 Live Demo & Deployment

The application is deployed on Vercel with high-performance edge caching and client-side execution:

🌐 **[https://bitmapindex.vercel.app](https://bitmapindex.vercel.app)**

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16 (App Router & Turbopack)
- **UI & Styling:** React 19, Tailwind CSS, Lucide Icons, Canvas API
- **State Management:** Zustand
- **Database / ORM:** Prisma ORM
- **Language:** TypeScript
- **Deployment & Edge:** Vercel Edge Network

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 18.x or later
- npm, pnpm, or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rajan-1357/bitmapindex.git
   cd bitmapindex
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 👥 Credits & Acknowledgements

- **Developed By:** **G Prathish Rajan**  
  *Register Number: 25BCE5367*

- **Guided By:** **Dr. Swaminathan A**  
  *Assistant Professor*
