import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver'; // We need file-saver, let me check if installed, if not I'll just use a standard blob approach

export type ReportType = 'lab' | 'city';

export interface ReportData {
  title: string;
  inputs: { label: string; value: string }[];
  processingSteps: string[];
  intermediateResults: string[];
  finalOutput: string[];
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
  let content = `=== ${data.title} ===\n\n`;
  
  content += `--- User Inputs ---\n`;
  data.inputs.forEach(i => content += `${i.label}: ${i.value}\n`);
  content += `\n`;

  content += `--- Processing Steps ---\n`;
  data.processingSteps.forEach(s => content += `- ${s}\n`);
  content += `\n`;

  content += `--- Intermediate Results ---\n`;
  data.intermediateResults.forEach(s => content += `${s}\n`);
  content += `\n`;

  content += `--- Final Output ---\n`;
  data.finalOutput.forEach(s => content += `${s}\n`);
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${data.title.replace(/\\s+/g, '_')}_Report.txt`);
}

function generatePdfReport(data: ReportData) {
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFontSize(18);
  doc.text(data.title, 20, yPos);
  yPos += 15;

  const sections = [
    { title: 'User Inputs', content: data.inputs.map(i => `${i.label}: ${i.value}`) },
    { title: 'Processing Steps', content: data.processingSteps.map(s => `- ${s}`) },
    { title: 'Intermediate Results', content: data.intermediateResults },
    { title: 'Final Output', content: data.finalOutput },
  ];

  sections.forEach(section => {
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text(section.title, 20, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    section.content.forEach(line => {
      // Very basic text wrapping
      const splitText = doc.splitTextToSize(line, 170);
      doc.text(splitText, 20, yPos);
      yPos += (splitText.length * 6);
      
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    yPos += 10;
  });

  doc.save(`${data.title.replace(/\\s+/g, '_')}_Report.pdf`);
}

async function generateDocxReport(data: ReportData) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: data.title, heading: HeadingLevel.HEADING_1 }),
          
          new Paragraph({ text: "User Inputs", heading: HeadingLevel.HEADING_2 }),
          ...data.inputs.map(i => new Paragraph({ children: [new TextRun({ text: `${i.label}: `, bold: true }), new TextRun(i.value)] })),
          
          new Paragraph({ text: "Processing Steps", heading: HeadingLevel.HEADING_2 }),
          ...data.processingSteps.map(s => new Paragraph({ text: s, bullet: { level: 0 } })),
          
          new Paragraph({ text: "Intermediate Results", heading: HeadingLevel.HEADING_2 }),
          ...data.intermediateResults.map(s => new Paragraph({ text: s })),
          
          new Paragraph({ text: "Final Output", heading: HeadingLevel.HEADING_2 }),
          ...data.finalOutput.map(s => new Paragraph({ text: s })),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${data.title.replace(/\\s+/g, '_')}_Report.docx`);
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
