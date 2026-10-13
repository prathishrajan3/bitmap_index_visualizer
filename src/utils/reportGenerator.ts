import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';

export type ReportType = 'lab' | 'city';

export interface ReportData {
  title: string;
  inputs: { label: string; value: string }[];
  processingSteps: string[];
  intermediateResults: string[];
  finalOutput: string[];

  // Detailed Tab Data
  dataset?: {
    columns: { name: string; type?: string; cardinality?: number; distribution?: string }[];
    rows: any[];
  };
  bitmapIndex?: {
    columns: {
      columnName: string;
      values: {
        valueName: string;
        bits: number[];
        count: number;
        densityPct: number;
      }[];
    }[];
  };
  algebra?: {
    operandA: string;
    operator: string;
    operandB: string;
    resultBits: number[];
    matchCount: number;
    totalRows: number;
  };
  query?: {
    sql: string;
    executionMsg?: string;
    results?: any[];
  };
  quiz?: {
    score: number;
    total: number;
    percentage: number;
    difficulty: string;
    completedAt: string;
  };
}

export async function generateReport(format: 'pdf' | 'docx' | 'txt', data: ReportData) {
  if (format === 'txt') {
    generateTxtReport(data);
  } else if (format === 'pdf') {
    generatePdfReport(data);
  } else if (format === 'docx') {
    await generateDocxReport(data);
  }
}

function generateTxtReport(data: ReportData) {
  let content = `================================================================================\n`;
  content += `                     ${data.title.toUpperCase()}                     \n`;
  content += `               Generated: ${new Date().toLocaleString()}               \n`;
  content += `================================================================================\n\n`;
  
  // Section 1: User Inputs & Parameters
  content += `--------------------------------------------------------------------------------\n`;
  content += `1. USER INPUTS & CONFIGURATION\n`;
  content += `--------------------------------------------------------------------------------\n`;
  data.inputs.forEach(i => {
    content += `• ${i.label.padEnd(24)}: ${i.value}\n`;
  });
  content += `\n`;

  // Section 2: Active Tab Dataset
  if (data.dataset && data.dataset.rows && data.dataset.rows.length > 0) {
    content += `--------------------------------------------------------------------------------\n`;
    content += `2. ACTIVE DATASET TABLE (${data.dataset.rows.length} Total Rows)\n`;
    content += `--------------------------------------------------------------------------------\n`;
    const colNames = data.dataset.columns.map(c => c.name);
    content += `| ID   | ` + colNames.map(c => c.padEnd(16)).join(' | ') + ` |\n`;
    content += `|------|` + colNames.map(() => '------------------').join('|') + `|\n`;
    
    // Sample rows up to 40
    const sampleRows = data.dataset.rows.slice(0, 40);
    sampleRows.forEach(row => {
      const vals = colNames.map(c => String(row[c] ?? '').slice(0, 16).padEnd(16));
      content += `| #${String(row.id).padEnd(4)} | ` + vals.join(' | ') + ` |\n`;
    });
    if (data.dataset.rows.length > 40) {
      content += `(... ${data.dataset.rows.length - 40} more rows omitted in preview ...)\n`;
    }
    content += `\n`;
  }

  // Section 3: Bitmap Index Matrix
  if (data.bitmapIndex && data.bitmapIndex.columns && data.bitmapIndex.columns.length > 0) {
    content += `--------------------------------------------------------------------------------\n`;
    content += `3. BITMAP INDEX MATRIX\n`;
    content += `--------------------------------------------------------------------------------\n`;
    data.bitmapIndex.columns.forEach(col => {
      content += `Column [${col.columnName}]:\n`;
      col.values.forEach(v => {
        const bitPreview = v.bits.slice(0, 24).join('') + (v.bits.length > 24 ? `... (${v.bits.length} bits)` : '');
        content += `  • Value: "${v.valueName.padEnd(18)}" | Bits: ${bitPreview.padEnd(30)} | Matches: ${String(v.count).padStart(3)} | Density: ${v.densityPct}%\n`;
      });
      content += `\n`;
    });
  }

  // Section 4: Boolean Algebra Operations
  if (data.algebra) {
    content += `--------------------------------------------------------------------------------\n`;
    content += `4. BOOLEAN ALGEBRA PLAYGROUND OPERATION\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `• Operation      : (${data.algebra.operandA}) ${data.algebra.operator} (${data.algebra.operandB})\n`;
    content += `• Matching Rows  : ${data.algebra.matchCount} / ${data.algebra.totalRows} (${Math.round((data.algebra.matchCount / Math.max(1, data.algebra.totalRows)) * 100)}% Selectivity)\n`;
    const bitStr = data.algebra.resultBits.slice(0, 32).join('') + (data.algebra.resultBits.length > 32 ? `... (${data.algebra.resultBits.length} bits total)` : '');
    content += `• Result Vector  : [${bitStr}]\n\n`;
  }

  // Section 5: Database Query Execution
  if (data.query) {
    content += `--------------------------------------------------------------------------------\n`;
    content += `5. NEON DATABASE SQL QUERY EXECUTION\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `• Executed SQL   :\n  ${data.query.sql}\n`;
    if (data.query.executionMsg) {
      content += `• Status / Time  : ${data.query.executionMsg}\n`;
    }
    if (data.query.results && data.query.results.length > 0) {
      content += `• Returned Rows  : ${data.query.results.length} record(s)\n`;
      const firstRow = data.query.results[0];
      const keys = Object.keys(firstRow);
      content += `  | ` + keys.map(k => k.padEnd(14)).join(' | ') + ` |\n`;
      data.query.results.slice(0, 20).forEach(r => {
        content += `  | ` + keys.map(k => String(r[k] ?? '').slice(0, 14).padEnd(14)).join(' | ') + ` |\n`;
      });
      if (data.query.results.length > 20) {
        content += `  (... ${data.query.results.length - 20} more records omitted ...)\n`;
      }
    }
    content += `\n`;
  }

  // Section 6: Quiz Performance
  if (data.quiz) {
    content += `--------------------------------------------------------------------------------\n`;
    content += `6. QUIZ PERFORMANCE & SCORE\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `• Questions Taken: ${data.quiz.total}\n`;
    content += `• Score Achieved : ${data.quiz.score} / ${data.quiz.total}\n`;
    content += `• Accuracy / Pct : ${data.quiz.percentage}%\n`;
    content += `• Difficulty     : ${data.quiz.difficulty}\n`;
    content += `• Completed At   : ${data.quiz.completedAt}\n`;
    content += `• Performance    : ${data.quiz.percentage >= 80 ? 'Mastery Level' : data.quiz.percentage >= 60 ? 'Proficient' : 'Needs Review'}\n\n`;
  } else {
    content += `--------------------------------------------------------------------------------\n`;
    content += `6. QUIZ PERFORMANCE & SCORE\n`;
    content += `--------------------------------------------------------------------------------\n`;
    content += `• Status: Quiz has not been attempted in this session.\n\n`;
  }

  content += `================================================================================\n`;
  content += `                      END OF LABORATORY REPORT                                  \n`;
  content += `================================================================================\n`;
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${data.title.replace(/\s+/g, '_')}_Report.txt`);
}

function generatePdfReport(data: ReportData) {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(data.title, 14, yPos);
  yPos += 7;

  // Subtitle / Date
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString()} | Bitmap Index Visualizer & Laboratory`, 14, yPos);
  yPos += 10;

  // 1. User Inputs Table
  autoTable(doc, {
    startY: yPos,
    head: [['Configuration Parameter', 'Value']],
    body: data.inputs.map(i => [i.label, i.value]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 }
  });
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // 2. Dataset Table
  if (data.dataset && data.dataset.rows && data.dataset.rows.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text(`Active Dataset (${data.dataset.rows.length} Total Rows)`, 14, yPos);
    yPos += 5;

    const colNames = data.dataset.columns.map(c => c.name);
    const headers = ['ID', ...colNames];
    const sampleRows = data.dataset.rows.slice(0, 30);
    const bodyRows = sampleRows.map(r => [String(r.id), ...colNames.map(c => String(r[c] ?? ''))]);

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 1.5 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // 3. Bitmap Index Matrix
  if (data.bitmapIndex && data.bitmapIndex.columns && data.bitmapIndex.columns.length > 0) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199);
    doc.text('Constructed Bitmap Index Matrix', 14, yPos);
    yPos += 5;

    const indexRows: any[] = [];
    data.bitmapIndex.columns.forEach(col => {
      col.values.forEach(v => {
        const bitPreview = v.bits.slice(0, 20).join('') + (v.bits.length > 20 ? '...' : '');
        indexRows.push([
          col.columnName,
          v.valueName,
          bitPreview,
          String(v.count),
          `${v.densityPct}%`
        ]);
      });
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Column', 'Categorical Value', 'Bit Vector (0/1)', 'Matches', 'Density']],
      body: indexRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // 4. Boolean Algebra Operation
  if (data.algebra) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199);
    doc.text('Boolean Algebra Execution', 14, yPos);
    yPos += 5;

    const bitStr = data.algebra.resultBits.slice(0, 28).join('') + (data.algebra.resultBits.length > 28 ? '...' : '');
    autoTable(doc, {
      startY: yPos,
      head: [['Algebraic Expression', 'Operator', 'Matching Rows', 'Resulting Bit Vector']],
      body: [[
        `${data.algebra.operandA} ${data.algebra.operator} ${data.algebra.operandB}`,
        data.algebra.operator,
        `${data.algebra.matchCount} / ${data.algebra.totalRows}`,
        bitStr
      ]],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Database SQL Query
  if (data.query) {
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199);
    doc.text('Database Query Execution (Neon DB)', 14, yPos);
    yPos += 5;

    const queryRows: any[] = [
      ['SQL Query', data.query.sql],
      ['Execution Status', data.query.executionMsg || 'Executed successfully']
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Property', 'Details']],
      body: queryRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    yPos = (doc as any).lastAutoTable.finalY + 6;

    if (data.query.results && data.query.results.length > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      const qCols = Object.keys(data.query.results[0]);
      const qRows = data.query.results.slice(0, 15).map(r => qCols.map(k => String(r[k] ?? '')));

      autoTable(doc, {
        startY: yPos,
        head: [qCols],
        body: qRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.5 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // 6. Quiz Score & Performance
  if (yPos > 240) { doc.addPage(); yPos = 20; }
  doc.setFontSize(13);
  doc.setTextColor(2, 132, 199);
  doc.text('Quiz Performance & Assessment', 14, yPos);
  yPos += 5;

  const quizRows: any[] = data.quiz ? [
    ['Questions Answered', String(data.quiz.total)],
    ['Correct Answers', String(data.quiz.score)],
    ['Score Percentage', `${data.quiz.percentage}%`],
    ['Difficulty Level', data.quiz.difficulty],
    ['Completion Time', data.quiz.completedAt],
    ['Performance Status', data.quiz.percentage >= 80 ? 'Mastery Level' : data.quiz.percentage >= 60 ? 'Proficient' : 'Needs Review']
  ] : [
    ['Quiz Status', 'Not attempted in current session']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Assessment Metric', 'Score / Status']],
    body: quizRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  doc.save(`${data.title.replace(/\s+/g, '_')}_Report.pdf`);
}

async function generateDocxReport(data: ReportData) {
  const children: any[] = [
    new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ 
      children: [
        new TextRun({ text: `Generated: ${new Date().toLocaleString()} | Bitmap Index Visualizer`, italics: true, color: '64748B' })
      ] 
    }),
    
    // User Inputs
    new Paragraph({ text: "1. User Inputs & Configuration", heading: HeadingLevel.HEADING_2 }),
    ...data.inputs.map(i => new Paragraph({ children: [new TextRun({ text: `${i.label}: `, bold: true }), new TextRun(i.value)] })),
  ];

  // Active Dataset
  if (data.dataset && data.dataset.rows && data.dataset.rows.length > 0) {
    children.push(new Paragraph({ text: `2. Active Dataset Table (${data.dataset.rows.length} Rows)`, heading: HeadingLevel.HEADING_2 }));
    
    const colNames = data.dataset.columns.map(c => c.name);
    const tableHeader = new TableRow({
      children: ['ID', ...colNames].map(h => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
      }))
    });

    const sampleRows = data.dataset.rows.slice(0, 25).map(r => new TableRow({
      children: [String(r.id), ...colNames.map(c => String(r[c] ?? ''))].map(v => new TableCell({
        children: [new Paragraph({ text: v })]
      }))
    }));

    children.push(new Table({
      rows: [tableHeader, ...sampleRows],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));
  }

  // Bitmap Index Matrix
  if (data.bitmapIndex && data.bitmapIndex.columns && data.bitmapIndex.columns.length > 0) {
    children.push(new Paragraph({ text: "3. Bitmap Index Matrix", heading: HeadingLevel.HEADING_2 }));

    const matrixHeader = new TableRow({
      children: ['Column', 'Value', 'Bit Vector', 'Matches', 'Density'].map(h => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })]
      }))
    });

    const matrixRows: TableRow[] = [];
    data.bitmapIndex.columns.forEach(col => {
      col.values.forEach(v => {
        matrixRows.push(new TableRow({
          children: [
            col.columnName,
            v.valueName,
            v.bits.slice(0, 20).join('') + (v.bits.length > 20 ? '...' : ''),
            String(v.count),
            `${v.densityPct}%`
          ].map(val => new TableCell({ children: [new Paragraph({ text: val })] }))
        }));
      });
    });

    children.push(new Table({
      rows: [matrixHeader, ...matrixRows],
      width: { size: 100, type: WidthType.PERCENTAGE }
    }));
  }

  // Boolean Algebra
  if (data.algebra) {
    children.push(new Paragraph({ text: "4. Boolean Algebra Execution", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Expression: ", bold: true }), new TextRun(`(${data.algebra.operandA}) ${data.algebra.operator} (${data.algebra.operandB})`)] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Matching Rows: ", bold: true }), new TextRun(`${data.algebra.matchCount} / ${data.algebra.totalRows}`)] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Result Vector: ", bold: true }), new TextRun(`[${data.algebra.resultBits.slice(0, 32).join('')}...]`)] }));
  }

  // Database Query Execution
  if (data.query) {
    children.push(new Paragraph({ text: "5. Database Query Execution (Neon DB)", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ children: [new TextRun({ text: "SQL Query: ", bold: true }), new TextRun(data.query.sql)] }));
    if (data.query.executionMsg) {
      children.push(new Paragraph({ children: [new TextRun({ text: "Status: ", bold: true }), new TextRun(data.query.executionMsg)] }));
    }
  }

  // Quiz Performance
  children.push(new Paragraph({ text: "6. Quiz Performance & Score", heading: HeadingLevel.HEADING_2 }));
  if (data.quiz) {
    children.push(new Paragraph({ children: [new TextRun({ text: "Score Achieved: ", bold: true }), new TextRun(`${data.quiz.score} / ${data.quiz.total} (${data.quiz.percentage}%)`)] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Difficulty: ", bold: true }), new TextRun(data.quiz.difficulty)] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Completed At: ", bold: true }), new TextRun(data.quiz.completedAt)] }));
  } else {
    children.push(new Paragraph({ text: "Status: Quiz not yet attempted in this session." }));
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
  triggerDownload(blob, `${data.title.replace(/\s+/g, '_')}_Report.docx`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
