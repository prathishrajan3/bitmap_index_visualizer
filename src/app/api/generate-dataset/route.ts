import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key",
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: "Please add your OPENAI_API_KEY to the environment variables to generate datasets with AI." 
      }, { status: 400 });
    }

    const { rowCount } = await req.json();
    const rows = Math.min(Math.max(10, rowCount || 10), 100); // Limit to 100 rows for AI generation to save tokens/time

    const prompt = `You are a Database Systems professor. Generate a sample dataset of ${rows} rows that is perfectly designed to teach students about Bitmap Indexing. 
Include columns that demonstrate varying cardinalities, such as:
- 'Gender' (Low cardinality)
- 'Department' or 'Role' (Medium cardinality)
- 'Active' (Boolean)
- 'AccessLevel' (Low cardinality e.g. 1, 2, 3)

Return ONLY valid JSON in the following format (an array of objects):
[
  { "id": 1, "Department": "HR", "Gender": "M", "Active": "True", "AccessLevel": "1" },
  ...
]
Do not wrap it in markdown blockquotes (\`\`\`json). Return exactly the JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content?.trim() || "[]";
    // Strip markdown formatting if the model still outputs it
    const jsonStr = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    
    let dataset = [];
    try {
      dataset = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON from AI", jsonStr);
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 500 });
    }

    // Convert all values to strings for consistency in the engine
    const normalizedDataset = dataset.map((row: any) => {
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = String(value);
      }
      return newRow;
    });

    return NextResponse.json({ dataset: normalizedDataset });
  } catch (error) {
    console.error("OpenAI Generate Dataset Error:", error);
    return NextResponse.json({ error: "An error occurred while generating the dataset." }, { status: 500 });
  }
}
