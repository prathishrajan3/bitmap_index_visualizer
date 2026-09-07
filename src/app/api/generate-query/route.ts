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

    const { schemaContext, prompt } = await req.json();

    let userMessage = `Here is the dataset schema context: ${schemaContext}. Please generate a valid SQL query for this dataset.`;
    if (prompt) {
      userMessage += ` The user explicitly requested: "${prompt}".`;
    } else {
      userMessage += ` Generate a random, interesting SELECT query for this dataset that filters on the values.`;
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
