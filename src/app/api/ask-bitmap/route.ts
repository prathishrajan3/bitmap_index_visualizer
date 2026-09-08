import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (requires OPENAI_API_KEY in env)
// We wrap it in a try-catch or just instantiate it so it doesn't crash on build if missing.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        explanation: "Please add your OPENAI_API_KEY to the Railway Dashboard (or local .env file) to enable the AI Tutor." 
      });
    }

    const { config, activeValue, activeRow, activeTab, sqlQuery, compareMetrics, prompt } = await req.json();

    let context = `The student is experimenting with a Bitmap Index Simulation.\n`;
    
    if (prompt) {
      context += `The student specifically asked: "${prompt}". Please answer this question directly while using the active context.`;
    } else if (activeTab === 'Compare' && compareMetrics) {
      context += `The student is comparing a Table Scan vs Bitmap Index for the query: "${sqlQuery}".\n`;
      context += `Metrics:\n`;
      context += `- Total Rows: ${compareMetrics.totalRows}\n`;
      context += `- Matching Rows: ${compareMetrics.matchingRows}\n`;
      context += `- Selectivity: ${(compareMetrics.selectivity * 100).toFixed(1)}%\n`;
      context += `- Table Scan Predicate Checks: ${compareMetrics.tableScanPredicateChecks}\n`;
      context += `- Bitmap Fetches: ${compareMetrics.bitmapCandidateRows} rows\n`;
      context += `- Bitmap Operations: ${compareMetrics.bitmapOperations} bitwise ops\n`;
      context += `Explain why the bitmap index is (or isn't) efficient for this specific query based on these metrics. Discuss the selectivity. Keep it educational.`;
    } else {
      context += `Current Configuration: Row Count = ${config.rowCount}. Schema has ${config.columns?.length || 0} columns.\n`;

      if (activeValue) {
        context += `The student just clicked on the bitmap index for the value: '${activeValue}'. `;
        context += `Explain how the bits for this specific value are set (1 if the row's value equals '${activeValue}', 0 otherwise) and how the density of this bitmap relates to the cardinality and distribution.`;
      } else if (activeRow !== null) {
        context += `The student just clicked on Row ID #${activeRow}. `;
        context += `Explain how looking up a specific row affects the bitmap index, or how a database uses the row ID to find the actual record after evaluating a bitmap.`;
      } else {
        context += `Explain the relationship between Cardinality and the resulting Bitmap Index density. Keep it educational and concise.`;
      }
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert Database Systems tutor. You MUST strictly only answer questions related to bitmap indexing. If the user asks about anything else, politely decline and redirect them back to bitmap indexing. Explain bitmap index concepts clearly, concisely, and naturally. Do not use robotic phrases like "Certainly!" or "Here is an explanation". Just answer the question directly. Limit to 3 short paragraphs max.' 
        },
        { 
          role: 'user', 
          content: context 
        }
      ],
      temperature: 0.7,
    });

    const explanation = response.choices[0].message.content;

    return NextResponse.json({ explanation });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ explanation: "An error occurred while connecting to the AI Tutor. Please check the server logs." }, { status: 500 });
  }
}
