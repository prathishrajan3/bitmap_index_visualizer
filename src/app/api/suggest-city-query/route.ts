import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        query: "Find roads with severe traffic"
      });
    }

    const { summary } = await req.json();

    const userMessage = `You are a Smart City Data Analyst.
Here are the most frequent attribute combinations currently active in the simulated city:
${JSON.stringify(summary, null, 2)}

Your task: Look at these high-count attributes and invent ONE natural language question that a city planner might ask to filter this data.
The question MUST combine 2 or 3 of the attributes mentioned above (e.g., combining a specific district, a specific entity type, and a traffic or risk level).
The combination must make logical sense for a city planner (e.g., don't ask for "clear traffic and critical risk").
Make the query read naturally, like a human typed it into a search box.

Examples of good queries:
"Find all hospitals in the Medical District that have critical risk"
"Show me intersections with severe traffic and poor air quality"
"Find power substations with warning status in the East Transit Hub"

DO NOT output any explanation, markdown, or JSON. Just output the raw natural language string.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [
        { role: 'system', content: 'You only output a single natural language query.' },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
    });

    const query = response.choices[0].message.content?.replace(/^["']|["']$/g, '').trim() || "Find intersections with severe traffic";

    return NextResponse.json({ query });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ query: "Find intersections with severe traffic" }, { status: 500 });
  }
}
