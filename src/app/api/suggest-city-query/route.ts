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
Here is an exact combination of attributes that is guaranteed to exist right now in the simulated city:
${JSON.stringify(summary, null, 2)}

Your task: Invent ONE natural language question that a city planner might ask to filter for this exact data.
The question MUST combine all the attributes mentioned above (e.g., combining the specific district, entity type, etc).
The combination must make logical sense for a city planner (e.g., don't ask for "clear traffic and critical risk").
Make the query read naturally, like a human typed it into a search box.
CRITICAL: Vary your output! Do not always ask about the same district or entity. Be creative and pick different combinations of the provided attributes every time.

Examples of good queries:
"Find all hospitals in the Medical District that have critical risk"
"Show me intersections with severe traffic and poor air quality"
"Find power substations with warning status in the East Transit Hub"

DO NOT output any explanation, markdown, or JSON. Just output the raw natural language string.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [
        { role: 'system', content: 'You only output a single natural language query. Be highly creative and vary the combinations.' },
        { role: 'user', content: userMessage }
      ],
      temperature: 1.0,
    });

    const query = response.choices[0].message.content?.replace(/^["']|["']$/g, '').trim() || "Find intersections with severe traffic";

    return NextResponse.json({ query });

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json({ query: "Find intersections with severe traffic" }, { status: 500 });
  }
}
