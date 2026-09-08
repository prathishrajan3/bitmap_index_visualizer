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

    const { schemaContext, prompt, datasetSample } = await req.json();

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
