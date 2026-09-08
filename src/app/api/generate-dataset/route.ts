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

    const { rowCount, schema, prompt, seed } = await req.json();
    const rows = Math.min(Math.max(10, rowCount || 10), 100); // Limit to 100 rows for AI generation to save tokens/time

    const schemaDesc = schema ? schema.map((c: any) => `- '${c.name}': cardinality ~${c.cardinality}, distribution ${c.distribution}`).join('\n') : '';

    const exampleObj: any = { id: "1" };
    if (schema) {
      schema.forEach((c: any) => {
        exampleObj[c.name] = "Value1";
      });
    } else {
      exampleObj["Column1"] = "ValueA";
    }

    const exampleJson = JSON.stringify([exampleObj, { "...": "..." }], null, 2);

    let llmPrompt = `You are a Database Systems professor. Generate a sample dataset of ${rows} rows that is perfectly designed to teach students about Bitmap Indexing.
Please generate realistic, human-readable data (e.g. names of actual departments, realistic years, 'Yes'/'No', etc) instead of random alphanumeric strings.

IMPORTANT: Use this random seed/nonce (${seed}) to ensure this generation is COMPLETELY DIFFERENT from previous generations. Choose different domain values, different distributions, and shuffle the row order differently than your default output.

The dataset MUST strictly follow this exact schema:
${schemaDesc}

For each column, try to respect the requested cardinality (number of unique values) and the statistical distribution as best as you can conceptually. Include an "id" column starting from 1.`;

    if (prompt && prompt.trim() !== '') {
      llmPrompt += `\n\nUSER REQUEST: The user has additionally requested the following context/theme for the data: "${prompt}". Please incorporate this theme as much as possible while respecting the schema.`;
    }

    llmPrompt += `\n\nReturn ONLY valid JSON in the following format (an array of objects). The keys of each object MUST exactly match the schema defined above:
${exampleJson}
Do not wrap it in markdown blockquotes (\`\`\`json). Return exactly the JSON array.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.4-mini-2026-03-17',
      messages: [{ role: 'user', content: llmPrompt }],
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
