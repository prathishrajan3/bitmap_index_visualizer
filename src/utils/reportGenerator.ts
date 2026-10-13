import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType 
} from 'docx';
import { 
  ReportFormat, 
  UnifiedReportData, 
  LaboratoryReportData, 
  CityReportData,
  ActivityLogEvent 
} from './reportTypes';
import { 
  formatReportDate, 
  formatTimingValue, 
  formatByteSize, 
  generateSafeReportFilename 
} from './reportDataBuilder';

interface AutoTableDoc extends jsPDF {
  lastAutoTable: { finalY: number };
}

export async function generateReport(format: ReportFormat, data: UnifiedReportData) {
  if (format === 'txt') {
    generateTxtReport(data);
  } else if (format === 'pdf') {
    generatePdfReport(data);
  } else if (format === 'docx') {
    await generateDocxReport(data);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === 'undefined') return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 100);
}

// ============================================================================
// 1. PLAIN TEXT REPORT GENERATOR
// ============================================================================

export function generateTxtReport(data: UnifiedReportData): string {
  const isLab = data.reportType === 'lab';
  const isCity = data.reportType === 'city';

  let txt = `================================================================================\n`;
  txt += `       ${(data.title || 'TECHNICAL REPORT').toUpperCase()}\n`;
  txt += `       Generated: ${formatReportDate(data.generatedAt || new Date().toISOString())}\n`;
  txt += `================================================================================\n\n`;

  // 1. Executive Summary
  if (data.executiveSummary && data.executiveSummary.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `1. EXECUTIVE SUMMARY\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.executiveSummary.forEach((item: string) => {
      txt += `• ${item}\n`;
    });
    txt += `\n`;
  }

  // 2. Configuration
  const configList = isLab 
    ? (data as LaboratoryReportData).configuration 
    : (data as CityReportData).simulationConfig;
  if (configList && configList.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `2. EXPERIMENTAL CONFIGURATION & PARAMETERS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    configList.forEach((c: { label: string; value: string | number }) => {
      txt += `• ${String(c.label).padEnd(28)}: ${c.value}\n`;
    });
    txt += `\n`;
  }

  // 3. Processing Steps, Intermediate Results, Final Output
  if (data.processingSteps && data.processingSteps.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `3. SCIENTIFIC METHODOLOGY & PROCESSING STEPS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.processingSteps.forEach((s: string) => {
      txt += `${s}\n`;
    });
    txt += `\n`;
  }

  if (data.intermediateResults && data.intermediateResults.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `4. INTERMEDIATE MEASUREMENTS & PIPELINE OUTPUTS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.intermediateResults.forEach((r: string) => {
      txt += `• ${r}\n`;
    });
    txt += `\n`;
  }

  // LAB SPECIFIC SECTIONS
  if (isLab) {
    const lab = data as LaboratoryReportData;

    // Dataset Details
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `5. DATASET SCHEMA & DESCRIPTIVE STATISTICS (${lab.datasetOverview.rowCount.toLocaleString()} Rows)\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `Domain: ${lab.datasetOverview.domain} | Source: ${lab.datasetOverview.source} | Duplicate Rows: ${lab.datasetOverview.duplicateRows}\n\n`;
    txt += `| Column Name          | Type      | Cardinality | Distribution | Missing | Distinct Sample Values\n`;
    txt += `|----------------------|-----------|-------------|--------------|---------|------------------------\n`;
    lab.datasetOverview.columns.forEach(col => {
      txt += `| ${col.name.padEnd(20)} | ${col.type.padEnd(9)} | ${String(col.cardinality).padEnd(11)} | ${(col.distribution || 'Uniform').padEnd(12)} | ${String(col.missingCount).padEnd(7)} | ${col.sampleDistinctValues.join(', ')}\n`;
    });
    txt += `\n`;

    // Dataset Preview
    if (lab.datasetOverview.sampleRows && lab.datasetOverview.sampleRows.length > 0) {
      txt += `Dataset Preview (Showing ${lab.datasetOverview.sampleRows.length} of ${lab.datasetOverview.rowCount} rows):\n`;
      const colNames = lab.datasetOverview.columns.map(c => c.name);
      txt += `| ID   | ` + colNames.map(c => c.padEnd(14)).join(' | ') + ` |\n`;
      lab.datasetOverview.sampleRows.slice(0, 20).forEach(r => {
        txt += `| #${String(r.id).padEnd(4)} | ` + colNames.map(c => String(r[c] ?? '').slice(0, 14).padEnd(14)).join(' | ') + ` |\n`;
      });
      txt += `\n`;
    }

    // Bitmap Index
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `6. BITMAP INDEX VECTORS & SATURATION METRICS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    if (lab.bitmapIndexStats.built) {
      txt += `• Total Vectors Built : ${lab.bitmapIndexStats.vectorCount}\n`;
      txt += `• Logical Bit Count   : ${lab.bitmapIndexStats.totalLogicalBits.toLocaleString()} bits\n`;
      txt += `• Total Set Bits (1s) : ${lab.bitmapIndexStats.setBitsCount.toLocaleString()} (${lab.bitmapIndexStats.overallDensityPct.toFixed(1)}% density)\n`;
      txt += `• Estimated Payload   : ${formatByteSize(lab.bitmapIndexStats.estimatedPayloadBytes)}\n`;
      txt += `• Index Build Duration: ${lab.bitmapIndexStats.buildDurationMs ? `${lab.bitmapIndexStats.buildDurationMs.toFixed(2)} ms` : 'Measured during construction'}\n\n`;

      txt += `| Column               | Category Value     | Matches | Density | Bit Vector Preview\n`;
      txt += `|----------------------|--------------------|---------|---------|----------------------------------\n`;
      lab.bitmapIndexStats.vectors.forEach(v => {
        txt += `| ${v.columnName.padEnd(20)} | ${v.valueName.padEnd(18)} | ${String(v.count).padStart(7)} | ${String(v.densityPct).padStart(5)}%  | [${v.bitsPreview}]\n`;
      });
    } else {
      txt += `• Index Status: Not constructed for active dataset.\n`;
    }
    txt += `\n`;

    // Boolean Algebra
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `7. BOOLEAN ALGEBRA OPERATIONS HISTORY\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    if (lab.algebraStats.operations.length > 0) {
      lab.algebraStats.operations.forEach((op, i) => {
        txt += `${i + 1}. (${op.operandA}) ${op.operator} (${op.operandB})\n`;
        txt += `   Matching Rows: ${op.matchCount} / ${op.totalRows} (${op.selectivityPct}% Selectivity) | Time: ${formatReportDate(op.timestamp)}\n`;
        txt += `   Vector: [${op.bitsPreview}]\n\n`;
      });
    } else {
      txt += `No Boolean algebra operations recorded.\n\n`;
    }

    // SQL Queries
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `8. DATABASE SQL QUERY EXECUTION LOG (${lab.queryStats.totalQueries} Total, ${lab.queryStats.successfulQueries} Succeeded, ${lab.queryStats.failedQueries} Failed)\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    if (lab.queryStats.queries.length > 0) {
      lab.queryStats.queries.forEach((q, i) => {
        txt += `${i + 1}. Query: ${q.sql}\n`;
        txt += `   Status: ${q.status.toUpperCase()} | Duration: ${formatTimingValue(q.executionTimeMs)} | Rows: ${q.returnedRows ?? 0} | Time: ${formatReportDate(q.timestamp)}\n`;
        if (q.error) txt += `   Error: ${q.error}\n`;
        txt += `\n`;
      });
    } else {
      txt += `No SQL queries executed in this session.\n\n`;
    }

    // Quiz & Learning Progress
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `9. QUIZ ASSESSMENT & LEARNING PROGRESS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    if (lab.quizStats.latestAttempt) {
      const q = lab.quizStats.latestAttempt;
      txt += `• Latest Completed Quiz: ${q.score} / ${q.total} (${q.percentage}%) - Difficulty: ${q.difficulty} - Source: ${q.source.toUpperCase()}\n`;
      txt += `• Total Completed Attempts: ${lab.quizStats.attemptsCount}\n`;
    } else {
      txt += `• Quiz Assessment: No completed quiz attempt recorded in this session.\n`;
    }
    txt += `• Overall Course Mastery: ${lab.learningStats.overallMastery}%\n`;
    if (lab.learningStats.modules.length > 0) {
      txt += `  Modules:\n`;
      lab.learningStats.modules.forEach(m => {
        txt += `  - ${m.title.padEnd(28)}: ${m.completed ? `Completed (${m.score}%)` : 'Pending'}\n`;
      });
    }
    txt += `\n`;
  }

  // CITY SPECIFIC SECTIONS
  if (isCity) {
    const city = data as CityReportData;

    // Infrastructure Distribution
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `5. URBAN INFRASTRUCTURE & CATEGORICAL DISTRIBUTION (${city.datasetStats.totalEntities.toLocaleString()} Entities)\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `Geographic Districts:\n`;
    Object.entries(city.datasetStats.districtCounts).forEach(([k, v]) => {
      const pct = ((v / city.datasetStats.totalEntities) * 100).toFixed(1);
      txt += `• ${k.padEnd(28)}: ${v.toLocaleString()} entities (${pct}%)\n`;
    });
    txt += `\nInfrastructure Entity Types:\n`;
    Object.entries(city.datasetStats.entityTypeCounts).forEach(([k, v]) => {
      const pct = ((v / city.datasetStats.totalEntities) * 100).toFixed(1);
      txt += `• ${k.padEnd(28)}: ${v.toLocaleString()} entities (${pct}%)\n`;
    });
    txt += `\nTraffic Levels:\n`;
    Object.entries(city.datasetStats.trafficDistribution).forEach(([k, v]) => {
      txt += `• ${k.padEnd(16)}: ${v.toLocaleString()} entities\n`;
    });
    txt += `\n`;

    // Active Query & Single-Query Benchmark
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `6. ACTIVE CITY QUERY & BENCHMARK EVALUATION\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `• Query Filter     : ${city.activeQuery.description}\n`;
    txt += `• Target Scope     : ${city.activeQuery.scope}\n`;
    txt += `• Matching Entities: ${city.activeQuery.matchingCount.toLocaleString()} / ${city.datasetStats.totalEntities.toLocaleString()} (${city.activeQuery.matchingPct.toFixed(1)}% Selectivity)\n\n`;

    if (city.currentBenchmark?.hasBenchmark && city.currentBenchmark.stats) {
      const b = city.currentBenchmark.stats;
      txt += `Current Benchmark Results:\n`;
      txt += `• Table Scan Median Latency: ${formatTimingValue(b.tableScanMedianMs, b.tableScanSubResolution)}\n`;
      txt += `• Packed Bitmap Latency    : ${formatTimingValue(b.bitmapMedianMs, b.bitmapSubResolution)}\n`;
      txt += `• Measured Speedup         : ${b.speedup ? `${b.speedup.toFixed(1)}x` : 'Inconclusive'}\n`;
      txt += `• Benchmark Winner         : ${b.winner.toUpperCase()}\n`;
      txt += `• Result-Set Validation    : ${b.resultSetsEqual ? '100% Identical' : 'FAILED - MISMATCH'}\n`;
      txt += `• Rows Avoided by Bitmap   : ${b.rowsAvoided.toLocaleString()} (${b.rowReductionPct.toFixed(1)}% reduction)\n`;
      txt += `• Break-Even Queries       : ${b.breakEvenStatus || 'N/A'}\n`;
    } else {
      txt += `• Single-Query Benchmark: Not executed yet on active dataset.\n`;
    }
    txt += `\n`;

    // Scaling Experiment
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `7. SCALING EXPERIMENT — MULTI-SCALE PERFORMANCE BENCHMARK\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    if (city.scalingExperiment?.hasScaling && city.scalingExperiment.runRecord) {
      const sr = city.scalingExperiment.runRecord;
      txt += `Query Evaluated: ${sr.querySummary} (${sr.scope})\n`;
      txt += `Executed At    : ${formatReportDate(sr.timestamp)}\n\n`;

      txt += `| Rows    | Gen Time | 1-Time Build | Table Scan | Packed Bitmap | Speedup | Winner | Break-Even | Payload\n`;
      txt += `|---------|----------|--------------|------------|---------------|---------|--------|------------|---------\n`;
      sr.datasetSizes.forEach(size => {
        const pt = sr.resultsBySize[size];
        if (!pt) return;
        const s = pt.stats;
        txt += `| ${String(size).padEnd(7)} | ${(pt.genTimeMs.toFixed(1) + 'ms').padEnd(8)} | ${(pt.buildTimeMs.toFixed(1) + 'ms').padEnd(12)} | ${formatTimingValue(s.tableScanMedianMs, s.tableScanSubResolution).padEnd(10)} | ${formatTimingValue(s.bitmapMedianMs, s.bitmapSubResolution).padEnd(13)} | ${(s.speedup ? s.speedup.toFixed(1) + 'x' : 'N/A').padEnd(7)} | ${s.winner.toUpperCase().padEnd(6)} | ${(s.breakEvenQueries ? `${s.breakEvenQueries}q` : 'N/A').padEnd(10)} | ${formatByteSize(pt.memoryBytes)}\n`;
      });
      txt += `\nScaling Analysis Findings:\n`;
      city.scalingExperiment.keyFindings.forEach(f => {
        txt += `• ${f}\n`;
      });
    } else {
      txt += `No scaling experiment results recorded. Run the Scaling Experiment in Nova City to benchmark retrieval across dataset sizes up to 250,000 records.\n`;
    }
    txt += `\n`;
  }

  // Final Output & Activity Timeline
  if (data.finalOutput && data.finalOutput.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `${isLab ? '10' : '8'}. EVIDENCE-BASED CONCLUSIONS & TECHNICAL OUTCOMES\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.finalOutput.forEach((o: string) => {
      txt += `• ${o}\n`;
    });
    txt += `\n`;
  }

  if (data.activitySummary?.timeline && data.activitySummary.timeline.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `${isLab ? '11' : '9'}. CHRONOLOGICAL USER ACTIVITY LOG (${data.activitySummary.totalEvents} Total Events Recorded)\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.activitySummary.timeline.slice(0, 30).forEach((ev: ActivityLogEvent) => {
      txt += `[${formatReportDate(ev.timestamp)}] ${ev.type.toUpperCase()}: ${ev.description} (${ev.status})\n`;
    });
    if (data.activitySummary.timeline.length > 30) {
      txt += `(... ${data.activitySummary.timeline.length - 30} earlier events omitted in preview ...)\n`;
    }
    txt += `\n`;
  }

  if (data.methodologyNotes && data.methodologyNotes.length > 0) {
    txt += `--------------------------------------------------------------------------------\n`;
    txt += `METHODOLOGY NOTES & BENCHMARK LIMITATIONS\n`;
    txt += `--------------------------------------------------------------------------------\n`;
    data.methodologyNotes.forEach((n: string) => {
      txt += `${n}\n`;
    });
    txt += `\n`;
  }

  txt += `================================================================================\n`;
  txt += `                      END OF TECHNICAL REPORT                                   \n`;
  txt += `================================================================================\n`;

  if (typeof window !== 'undefined') {
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, generateSafeReportFilename(data.title || 'Technical_Report', 'txt'));
  }

  return txt;
}

// ============================================================================
// 2. PDF REPORT GENERATOR (jsPDF & jspdf-autotable)
// ============================================================================

export function generatePdfReport(data: UnifiedReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const isLab = data.reportType === 'lab';
  const isCity = data.reportType === 'city';
  let yPos = 18;

  const checkPageBreak = (neededHeight: number) => {
    if (yPos + neededHeight > 275) {
      doc.addPage();
      yPos = 18;
      return true;
    }
    return false;
  };

  const renderSectionHeader = (title: string) => {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(14, 116, 144); // cyan-700
    doc.text(title, 14, yPos);
    yPos += 2;
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(14, yPos, 196, yPos);
    yPos += 5;
  };

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.title || 'TECHNICAL REPORT', 14, yPos);
  yPos += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${formatReportDate(data.generatedAt || new Date().toISOString())} | Bitmap Index Visualizer & Digital Twin`, 14, yPos);
  yPos += 8;

  // 1. Executive Summary
  if (data.executiveSummary && data.executiveSummary.length > 0) {
    renderSectionHeader('1. Executive Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    data.executiveSummary.forEach((point: string) => {
      checkPageBreak(8);
      const split = doc.splitTextToSize(`• ${point}`, 180);
      doc.text(split, 14, yPos);
      yPos += split.length * 4.2;
    });
    yPos += 3;
  }

  // 2. Configuration Parameters
  const configList = isLab 
    ? (data as LaboratoryReportData).configuration 
    : (data as CityReportData).simulationConfig;
  if (configList && configList.length > 0) {
    renderSectionHeader('2. Experimental Configuration & Parameters');
    autoTable(doc, {
      startY: yPos,
      head: [['Configuration Parameter', 'Value']],
      body: configList.map((c: { label: string; value: string | number }) => [c.label, String(c.value)]),
      theme: 'striped',
      showHead: 'everyPage',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
  }

  // LAB SPECIFIC PDF
  if (isLab) {
    const lab = data as LaboratoryReportData;

    // Dataset Summary
    renderSectionHeader(`3. Dataset Overview & Schema (${lab.datasetOverview.rowCount.toLocaleString()} Rows)`);
    autoTable(doc, {
      startY: yPos,
      head: [['Column', 'Type', 'Cardinality', 'Distribution', 'Missing', 'Sample Distinct Values']],
      body: lab.datasetOverview.columns.map(c => [
        c.name,
        c.type,
        String(c.cardinality),
        c.distribution || 'Uniform',
        String(c.missingCount),
        c.sampleDistinctValues.join(', ')
      ]),
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 1.8 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;

    // Dataset Sample Preview
    if (lab.datasetOverview.sampleRows && lab.datasetOverview.sampleRows.length > 0) {
      renderSectionHeader(`Dataset Sample Preview (Showing ${lab.datasetOverview.sampleRows.length} of ${lab.datasetOverview.rowCount} Rows)`);
      const colNames = lab.datasetOverview.columns.map(c => c.name);
      autoTable(doc, {
        startY: yPos,
        head: [['ID', ...colNames]],
        body: lab.datasetOverview.sampleRows.slice(0, 15).map(r => [
          `#${r.id}`,
          ...colNames.map(c => String(r[c] ?? ''))
        ]),
        theme: 'striped',
        showHead: 'everyPage',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.5 }
      });
      yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    }

    // Bitmap Index
    renderSectionHeader('4. Bitmap Index Construction & Density Metrics');
    if (lab.bitmapIndexStats.built) {
      autoTable(doc, {
        startY: yPos,
        head: [['Column', 'Categorical Value', 'Bit Vector Preview', 'Matches', 'Density']],
        body: lab.bitmapIndexStats.vectors.slice(0, 25).map(v => [
          v.columnName,
          v.valueName,
          v.bitsPreview,
          String(v.count),
          `${v.densityPct}%`
        ]),
        theme: 'striped',
        showHead: 'everyPage',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 1.8 }
      });
      yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Bitmap index has not been constructed for this dataset.', 14, yPos);
      yPos += 8;
    }

    // Boolean Algebra
    if (lab.algebraStats.operations.length > 0) {
      renderSectionHeader('5. Boolean Algebra Operations History');
      autoTable(doc, {
        startY: yPos,
        head: [['Algebraic Expression', 'Operator', 'Matching Rows', 'Selectivity', 'Resulting Vector']],
        body: lab.algebraStats.operations.map(op => [
          `(${op.operandA}) ${op.operator} (${op.operandB})`,
          op.operator,
          `${op.matchCount} / ${op.totalRows}`,
          `${op.selectivityPct}%`,
          op.bitsPreview
        ]),
        theme: 'grid',
        showHead: 'everyPage',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });
      yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    }

    // SQL Query Log
    if (lab.queryStats.queries.length > 0) {
      renderSectionHeader(`6. Database SQL Query Execution History (${lab.queryStats.totalQueries} Executions)`);
      autoTable(doc, {
        startY: yPos,
        head: [['SQL Statement', 'Status', 'Duration', 'Rows', 'Timestamp']],
        body: lab.queryStats.queries.map(q => [
          q.sql,
          q.status.toUpperCase(),
          formatTimingValue(q.executionTimeMs),
          String(q.returnedRows ?? 0),
          formatReportDate(q.timestamp)
        ]),
        theme: 'striped',
        showHead: 'everyPage',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });
      yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
    }

    // Quiz & Learning Progress
    renderSectionHeader('7. Quiz Assessment & Learning Mastery Progress');
    const quizRows: string[][] = [];
    if (lab.quizStats.latestAttempt) {
      const q = lab.quizStats.latestAttempt;
      quizRows.push(['Latest Completed Quiz', `${q.score} / ${q.total} (${q.percentage}%) - ${q.difficulty} (${q.source.toUpperCase()})`]);
      quizRows.push(['Total Completed Attempts', String(lab.quizStats.attemptsCount)]);
    } else {
      quizRows.push(['Quiz Assessment Status', 'No completed quiz attempt recorded in this session']);
    }
    quizRows.push(['Overall Course Mastery', `${lab.learningStats.overallMastery}%`]);
    lab.learningStats.modules.forEach(m => {
      quizRows.push([`Module: ${m.title}`, m.completed ? `Completed (${m.score}%)` : 'Not completed']);
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Learning Metric', 'Performance / Progress']],
      body: quizRows,
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
  }

  // CITY SPECIFIC PDF
  if (isCity) {
    const city = data as CityReportData;

    // Infrastructure Distribution
    renderSectionHeader(`3. Urban Infrastructure Categorical Distribution (${city.datasetStats.totalEntities.toLocaleString()} Entities)`);
    const distRows = Object.entries(city.datasetStats.districtCounts).map(([k, v]) => [
      'District',
      k,
      String(v),
      `${((v / city.datasetStats.totalEntities) * 100).toFixed(1)}%`
    ]);
    const typeRows = Object.entries(city.datasetStats.entityTypeCounts).map(([k, v]) => [
      'Entity Type',
      k,
      String(v),
      `${((v / city.datasetStats.totalEntities) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category Dimension', 'Value Name', 'Entity Count', '% of Grid']],
      body: [...distRows, ...typeRows],
      theme: 'striped',
      showHead: 'everyPage',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 1.8 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;

    // Active Query & Live Benchmark
    renderSectionHeader('4. Live Query Execution & Benchmark Performance');
    const benchRows: string[][] = [
      ['Active Query Filter', city.activeQuery.description],
      ['Target Scope', city.activeQuery.scope],
      ['Matching City Entities', `${city.activeQuery.matchingCount.toLocaleString()} / ${city.datasetStats.totalEntities.toLocaleString()} (${city.activeQuery.matchingPct.toFixed(1)}%)`]
    ];

    if (city.currentBenchmark?.hasBenchmark && city.currentBenchmark.stats) {
      const b = city.currentBenchmark.stats;
      benchRows.push(['Table Scan Median Latency', formatTimingValue(b.tableScanMedianMs, b.tableScanSubResolution)]);
      benchRows.push(['Packed Bitmap Median Latency', formatTimingValue(b.bitmapMedianMs, b.bitmapSubResolution)]);
      benchRows.push(['Measured Speedup Multiplier', b.speedup ? `${b.speedup.toFixed(1)}x` : 'Inconclusive']);
      benchRows.push(['Benchmark Winner', b.winner.toUpperCase()]);
      benchRows.push(['Result-Set Correctness Validation', b.resultSetsEqual ? '100% Identical record ID match' : 'FAILED - MISMATCH']);
      benchRows.push(['Row Reduction by Bitmap Filter', `${b.rowsAvoided.toLocaleString()} avoided (${b.rowReductionPct.toFixed(1)}%)`]);
      benchRows.push(['Break-Even Query Threshold', b.breakEvenStatus || 'N/A']);
    } else {
      benchRows.push(['Benchmark Status', 'Not executed yet on active dataset']);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Benchmark Property', 'Measurement / Outcome']],
      body: benchRows,
      theme: 'grid',
      showHead: 'everyPage',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;

    // Scaling Experiment Table
    renderSectionHeader('5. Scaling Experiment Multi-Scale Retrieval Results');
    if (city.scalingExperiment?.hasScaling && city.scalingExperiment.runRecord) {
      const sr = city.scalingExperiment.runRecord;
      const scalingRows = sr.datasetSizes.map(size => {
        const pt = sr.resultsBySize[size];
        if (!pt) return [String(size), '-', '-', '-', '-', '-', '-', '-'];
        const s = pt.stats;
        return [
          size.toLocaleString(),
          formatTimingValue(s.tableScanMedianMs, s.tableScanSubResolution),
          formatTimingValue(s.bitmapMedianMs, s.bitmapSubResolution),
          s.speedup ? `${s.speedup.toFixed(1)}x` : 'N/A',
          s.winner.toUpperCase(),
          `${(s.matchingRows / s.totalRows * 100).toFixed(1)}%`,
          `${s.indexBuildTimeMs ? s.indexBuildTimeMs.toFixed(1) + 'ms' : 'N/A'}`,
          s.breakEvenQueries ? `${s.breakEvenQueries}q` : 'N/A',
          formatByteSize(pt.memoryBytes)
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Rows', 'Table Scan', 'Bitmap', 'Speedup', 'Winner', 'Selectivity', '1-T Build', 'Break-Even', 'Payload']],
        body: scalingRows,
        theme: 'striped',
        showHead: 'everyPage',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.5 }
      });
      yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;

      // Key Findings
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      city.scalingExperiment.keyFindings.forEach(f => {
        checkPageBreak(8);
        const split = doc.splitTextToSize(`• ${f}`, 180);
        doc.text(split, 14, yPos);
        yPos += split.length * 4;
      });
      yPos += 4;
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('No scaling experiment results recorded. Run the Scaling Experiment in Performance Lab.', 14, yPos);
      yPos += 8;
    }
  }

  // Methodology Steps & Findings
  if (data.processingSteps && data.processingSteps.length > 0) {
    renderSectionHeader(`${isLab ? '8' : '6'}. Scientific Methodology Steps`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    data.processingSteps.forEach((s: string) => {
      checkPageBreak(6);
      const split = doc.splitTextToSize(s, 180);
      doc.text(split, 14, yPos);
      yPos += split.length * 4;
    });
    yPos += 4;
  }

  if (data.finalOutput && data.finalOutput.length > 0) {
    renderSectionHeader(`${isLab ? '9' : '7'}. Technical Outcomes & Evidence`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    data.finalOutput.forEach((o: string) => {
      checkPageBreak(6);
      const split = doc.splitTextToSize(`• ${o}`, 180);
      doc.text(split, 14, yPos);
      yPos += split.length * 4;
    });
    yPos += 4;
  }

  if (data.activitySummary?.timeline && data.activitySummary.timeline.length > 0) {
    renderSectionHeader(`${isLab ? '10' : '8'}. User Activity Timeline (${data.activitySummary.totalEvents} Total Events Recorded)`);
    autoTable(doc, {
      startY: yPos,
      head: [['Timestamp', 'Event Type', 'Description', 'Status']],
      body: data.activitySummary.timeline.slice(0, 20).map((ev: ActivityLogEvent) => [
        formatReportDate(ev.timestamp),
        ev.type.toUpperCase(),
        ev.description,
        ev.status.toUpperCase()
      ]),
      theme: 'striped',
      showHead: 'everyPage',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 1.5 }
    });
    yPos = (doc as AutoTableDoc).lastAutoTable.finalY + 8;
  }

  if (data.methodologyNotes && data.methodologyNotes.length > 0) {
    renderSectionHeader('Benchmark Methodology & Limitations');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    data.methodologyNotes.forEach((n: string) => {
      checkPageBreak(6);
      const split = doc.splitTextToSize(n, 180);
      doc.text(split, 14, yPos);
      yPos += split.length * 3.8;
    });
  }

  // Page numbering in footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${i} of ${totalPages}  |  Generated: ${formatReportDate(data.generatedAt || new Date().toISOString())}  |  Bitmap Index Visualizer`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }

  if (typeof window !== 'undefined') {
    doc.save(generateSafeReportFilename(data.title || 'Technical_Report', 'pdf'));
  }
}

// ============================================================================
// 3. MICROSOFT WORD DOCX REPORT GENERATOR (docx package)
// ============================================================================

export async function generateDocxReport(data: UnifiedReportData): Promise<Blob> {
  const isLab = data.reportType === 'lab';
  const isCity = data.reportType === 'city';

  const children: (Paragraph | Table)[] = [
    new Paragraph({ 
      text: data.title || 'Technical Report', 
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 }
    }),
    new Paragraph({ 
      children: [
        new TextRun({ 
          text: `Generated: ${formatReportDate(data.generatedAt || new Date().toISOString())} | Bitmap Index Visualizer & Digital Twin`, 
          italics: true, 
          color: '64748B', 
          size: 18 
        })
      ],
      spacing: { after: 250 }
    })
  ];

  const createTable = (headers: string[], rows: string[][]): Table => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(h => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16 })] })]
          }))
        }),
        ...rows.map(r => new TableRow({
          children: r.map(c => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: c, size: 16 })] })]
          }))
        }))
      ]
    });
  };

  // Executive Summary
  if (data.executiveSummary && data.executiveSummary.length > 0) {
    children.push(new Paragraph({ text: '1. Executive Summary', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    data.executiveSummary.forEach((pt: string) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${pt}`, size: 20 })], spacing: { after: 60 } }));
    });
  }

  // Configuration
  const configList = isLab 
    ? (data as LaboratoryReportData).configuration 
    : (data as CityReportData).simulationConfig;
  if (configList && configList.length > 0) {
    children.push(new Paragraph({ text: '2. Experimental Configuration', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(createTable(['Configuration Parameter', 'Value'], configList.map((c: { label: string; value: string | number }) => [c.label, String(c.value)])));
  }

  // LAB SPECIFIC DOCX
  if (isLab) {
    const lab = data as LaboratoryReportData;

    children.push(new Paragraph({ text: `3. Dataset Overview & Schema (${lab.datasetOverview.rowCount} Rows)`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(createTable(
      ['Column', 'Type', 'Cardinality', 'Distribution', 'Missing', 'Sample Distinct Values'],
      lab.datasetOverview.columns.map(c => [
        c.name,
        c.type,
        String(c.cardinality),
        c.distribution || 'Uniform',
        String(c.missingCount),
        c.sampleDistinctValues.join(', ')
      ])
    ));

    if (lab.bitmapIndexStats.built) {
      children.push(new Paragraph({ text: '4. Bitmap Index Vectors & Metrics', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(createTable(
        ['Column', 'Category Value', 'Bit Vector Preview', 'Matches', 'Density'],
        lab.bitmapIndexStats.vectors.slice(0, 30).map(v => [
          v.columnName,
          v.valueName,
          v.bitsPreview,
          String(v.count),
          `${v.densityPct}%`
        ])
      ));
    }

    if (lab.algebraStats.operations.length > 0) {
      children.push(new Paragraph({ text: '5. Boolean Algebra Operations History', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(createTable(
        ['Expression', 'Operator', 'Matching Rows', 'Selectivity', 'Vector Preview'],
        lab.algebraStats.operations.map(op => [
          `(${op.operandA}) ${op.operator} (${op.operandB})`,
          op.operator,
          `${op.matchCount} / ${op.totalRows}`,
          `${op.selectivityPct}%`,
          op.bitsPreview
        ])
      ));
    }

    if (lab.queryStats.queries.length > 0) {
      children.push(new Paragraph({ text: `6. SQL Query Execution Log (${lab.queryStats.totalQueries} Queries)`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
      children.push(createTable(
        ['SQL Statement', 'Status', 'Duration', 'Rows', 'Timestamp'],
        lab.queryStats.queries.map(q => [
          q.sql,
          q.status.toUpperCase(),
          formatTimingValue(q.executionTimeMs),
          String(q.returnedRows ?? 0),
          formatReportDate(q.timestamp)
        ])
      ));
    }

    children.push(new Paragraph({ text: '7. Quiz Assessment & Learning Mastery', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    const quizRows: string[][] = [];
    if (lab.quizStats.latestAttempt) {
      const q = lab.quizStats.latestAttempt;
      quizRows.push(['Latest Completed Quiz', `${q.score}/${q.total} (${q.percentage}%) - ${q.difficulty} (${q.source.toUpperCase()})`]);
    } else {
      quizRows.push(['Quiz Assessment', 'No completed quiz attempt recorded in this session']);
    }
    quizRows.push(['Overall Course Mastery', `${lab.learningStats.overallMastery}%`]);
    lab.learningStats.modules.forEach(m => {
      quizRows.push([`Module: ${m.title}`, m.completed ? `Completed (${m.score}%)` : 'Not completed']);
    });
    children.push(createTable(['Assessment Metric', 'Score / Status'], quizRows));
  }

  // CITY SPECIFIC DOCX
  if (isCity) {
    const city = data as CityReportData;

    children.push(new Paragraph({ text: `3. Urban Infrastructure Categorical Distribution`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    const distRows = Object.entries(city.datasetStats.districtCounts).map(([k, v]) => ['District', k, String(v), `${((v / city.datasetStats.totalEntities) * 100).toFixed(1)}%`]);
    const typeRows = Object.entries(city.datasetStats.entityTypeCounts).map(([k, v]) => ['Entity Type', k, String(v), `${((v / city.datasetStats.totalEntities) * 100).toFixed(1)}%`]);
    children.push(createTable(['Dimension', 'Category', 'Entity Count', '% of Grid'], [...distRows, ...typeRows]));

    children.push(new Paragraph({ text: `4. Live Query Execution & Benchmark Performance`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    const benchRows: string[][] = [
      ['Query Filter', city.activeQuery.description],
      ['Target Scope', city.activeQuery.scope],
      ['Matching Entities', `${city.activeQuery.matchingCount} / ${city.datasetStats.totalEntities} (${city.activeQuery.matchingPct.toFixed(1)}%)`]
    ];
    if (city.currentBenchmark?.hasBenchmark && city.currentBenchmark.stats) {
      const b = city.currentBenchmark.stats;
      benchRows.push(['Table Scan Median Latency', formatTimingValue(b.tableScanMedianMs, b.tableScanSubResolution)]);
      benchRows.push(['Packed Bitmap Median Latency', formatTimingValue(b.bitmapMedianMs, b.bitmapSubResolution)]);
      benchRows.push(['Speedup Multiplier', b.speedup ? `${b.speedup.toFixed(1)}x` : 'Inconclusive']);
      benchRows.push(['Winner', b.winner.toUpperCase()]);
      benchRows.push(['Result-Set Validation', b.resultSetsEqual ? '100% Identical' : 'FAILED - MISMATCH']);
      benchRows.push(['Rows Avoided by Bitmap', `${b.rowsAvoided.toLocaleString()} (${b.rowReductionPct.toFixed(1)}%)`]);
      benchRows.push(['Break-Even Queries', b.breakEvenStatus || 'N/A']);
    }
    children.push(createTable(['Benchmark Property', 'Value'], benchRows));

    children.push(new Paragraph({ text: `5. Scaling Experiment Results`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    if (city.scalingExperiment?.hasScaling && city.scalingExperiment.runRecord) {
      const sr = city.scalingExperiment.runRecord;
      const sRows = sr.datasetSizes.map(size => {
        const pt = sr.resultsBySize[size];
        if (!pt) return [String(size), '-', '-', '-', '-', '-', '-'];
        const s = pt.stats;
        return [
          size.toLocaleString(),
          formatTimingValue(s.tableScanMedianMs, s.tableScanSubResolution),
          formatTimingValue(s.bitmapMedianMs, s.bitmapSubResolution),
          s.speedup ? `${s.speedup.toFixed(1)}x` : 'N/A',
          s.winner.toUpperCase(),
          `${pt.buildTimeMs.toFixed(1)}ms`,
          s.breakEvenQueries ? `${s.breakEvenQueries}q` : 'N/A'
        ];
      });
      children.push(createTable(['Rows', 'Table Scan', 'Packed Bitmap', 'Speedup', 'Winner', '1-T Build', 'Break-Even'], sRows));
      city.scalingExperiment.keyFindings.forEach(f => {
        children.push(new Paragraph({ children: [new TextRun({ text: `• ${f}`, size: 18 })], spacing: { before: 40 } }));
      });
    } else {
      children.push(new Paragraph({ text: 'No scaling experiment results recorded. Run the Scaling Experiment in Performance Lab.' }));
    }
  }

  // Methodology Steps
  if (data.processingSteps && data.processingSteps.length > 0) {
    children.push(new Paragraph({ text: 'Scientific Methodology Steps', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    data.processingSteps.forEach((s: string) => {
      children.push(new Paragraph({ children: [new TextRun({ text: s, size: 18 })], spacing: { after: 40 } }));
    });
  }

  // Final Output
  if (data.finalOutput && data.finalOutput.length > 0) {
    children.push(new Paragraph({ text: 'Technical Outcomes & Evidence', heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    data.finalOutput.forEach((o: string) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${o}`, size: 18 })], spacing: { after: 40 } }));
    });
  }

  // Activity Timeline
  if (data.activitySummary?.timeline && data.activitySummary.timeline.length > 0) {
    children.push(new Paragraph({ text: `User Activity Timeline (${data.activitySummary.totalEvents} Total Events)`, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }));
    children.push(createTable(
      ['Timestamp', 'Event Type', 'Description', 'Status'],
      data.activitySummary.timeline.slice(0, 20).map((ev: ActivityLogEvent) => [
        formatReportDate(ev.timestamp),
        ev.type.toUpperCase(),
        ev.description,
        ev.status.toUpperCase()
      ])
    ));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  if (typeof window !== 'undefined') {
    triggerDownload(blob, generateSafeReportFilename(data.title || 'Technical_Report', 'docx'));
  }
  return blob;
}

export type { ReportData } from './reportTypes';
