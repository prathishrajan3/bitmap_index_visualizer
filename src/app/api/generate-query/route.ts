import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        query: "SELECT * FROM DatasetRow;" // Fallback if no API key
      });
    }

    const body = await req.json();
    const { schemaContext, prompt, datasetSample, mode, allowedColumns, allowedValues } = body;

    if (mode === 'city') {
      const userMessage = `You are an AI that translates natural language queries into a strict JSON AST for a Smart City Digital Twin.
Allowed Columns and their Exact Expected Values: ${JSON.stringify(allowedValues)}
Operators for logical: AND, OR, NOT.
Operators for predicate: =, !=
Predicate Format: { "column": "...", "operator": "=", "value": "..." }
Logical Format: { "operator": "AND", "conditions": [...] }
You MUST output ONLY valid JSON. Do not use markdown blocks, backticks, or conversational text.
CRITICAL: When generating a predicate, the "value" MUST EXACTLY MATCH one of the allowed strings provided above (case-sensitive). Do not guess values.

User Query: "${prompt}"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-5.4-mini-2026-03-17',
        messages: [
          { role: 'system', content: 'Output ONLY raw JSON.' },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
      });

      let queryText = response.choices[0].message.content?.trim() || "{}";
      // Strip markdown if the AI stubbornly included it
      queryText = queryText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();

      let ast;
      try {
        ast = JSON.parse(queryText);
      } catch (e) {
        throw new Error("Failed to parse JSON AST from AI response");
      }
      return NextResponse.json({ query: ast });
    }

    // Default SQL Mode
    let userMessage = `Here is the dataset schema context: ${schemaContext}.
Here is a sample of the actual data: ${JSON.stringify(datasetSample)}.
Please generate a valid SQL query for this dataset.
IMPORTANT: You MUST use exact matching string values from the sample data in your WHERE clauses. Do NOT guess values. For example, if the data has 'CSE', do not query for 'Computer Science'.`;
    if (prompt) {
      userMessage += `\n\nThe user explicitly requested: "${prompt}".`;
    } else {
      userMessage += `\n\nGenerate a random, interesting SELECT query for this dataset that filters on the values.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert SQL query generator. Only output the raw SQL query. Do not use markdown blocks, backticks, or any conversational text. Just the SQL.' 
        },
        { 
          role: 'user', 
          content: userMessage 
        }
      ],
      temperature: 0.7,
    });

    const query = response.choices[0].message.content?.trim() || "SELECT * FROM DatasetRow;";

    return NextResponse.json({ query });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ query: "SELECT * FROM DatasetRow;" }, { status: 500 });
  }
}
