import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { resolveCityQueryAST } from '@/lib/city/smartQueryPool';

export async function POST(req: Request) {
  let prompt = '';
  let mode = '';

  try {
    const body = await req.json();
    prompt = body.prompt || '';
    mode = body.mode || '';

    if (mode === 'city') {
      const apiKey = process.env.OPENAI_API_KEY;

      if (apiKey && apiKey.trim() !== '' && !apiKey.includes('dummy')) {
        try {
          const openai = new OpenAI({ apiKey });
          const { allowedValues } = body;
          const userMessage = `You are an AI that translates natural language queries into a strict JSON AST for a Smart City Digital Twin.
Allowed Columns and their Exact Expected Values: ${JSON.stringify(allowedValues || {})}
Operators for logical: AND, OR, NOT.
Operators for predicate: =, !=
Predicate Format: { "column": "...", "operator": "=", "value": "..." }
Logical Format: { "operator": "AND", "conditions": [...] }
Output ONLY valid JSON.
User Query: "${prompt}"`;

          const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Output ONLY raw JSON.' },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.1,
          });

          let queryText = response.choices[0].message.content?.trim() || "{}";
          queryText = queryText.replace(/^```json/g, '').replace(/^```/g, '').replace(/```$/g, '').trim();

          const parsedAst = JSON.parse(queryText);
          if (parsedAst && (parsedAst.column || parsedAst.operator)) {
            return NextResponse.json({ query: parsedAst });
          }
        } catch (openAiError) {
          console.warn('OpenAI city query translation failed, using intelligent semantic AST resolver:', openAiError);
        }
      }

      // Zero-latency intelligent semantic AST resolver
      const resolvedAst = resolveCityQueryAST(prompt);
      return NextResponse.json({ query: resolvedAst });
    }

    // Default SQL Mode
    const { schemaContext, datasetSample } = body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('dummy')) {
      return NextResponse.json({ query: "SELECT * FROM DatasetRow;" });
    }

    const openai = new OpenAI({ apiKey });
    let userMessage = `Here is the dataset schema context: ${schemaContext}.
Here is a sample of the actual data: ${JSON.stringify(datasetSample)}.
Please generate a valid SQL query for this dataset.
IMPORTANT: You MUST use exact matching string values from the sample data in your WHERE clauses.`;
    if (prompt) {
      userMessage += `\n\nThe user explicitly requested: "${prompt}".`;
    } else {
      userMessage += `\n\nGenerate a random, interesting SELECT query for this dataset that filters on the values.`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
    console.error("Generate Query Error:", error);
    if (mode === 'city') {
      const fallbackAst = resolveCityQueryAST(prompt);
      return NextResponse.json({ query: fallbackAst });
    }
    return NextResponse.json({ query: "SELECT * FROM DatasetRow;" });
  }
}
