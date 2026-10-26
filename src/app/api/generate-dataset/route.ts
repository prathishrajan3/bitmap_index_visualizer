import { NextResponse } from 'next/server';
import { 
  ColumnDef, 
  KNOWN_CATEGORICAL_GENERATORS, 
  DomainProfile, 
  DOMAIN_PROFILES, 
  isGenericColumnName, 
  inferDomainAndRenameColumns, 
  getOptionsForColumn, 
  generateFallbackThemedDataset 
} from '@/lib/dataset/themedDatasetGenerator';

export { 
  KNOWN_CATEGORICAL_GENERATORS, 
  DOMAIN_PROFILES, 
  isGenericColumnName, 
  inferDomainAndRenameColumns, 
  getOptionsForColumn, 
  generateFallbackThemedDataset 
};
export type { ColumnDef, DomainProfile };

export async function POST(req: Request) {
  let requestBody: any = {};
  try {
    requestBody = await req.json();
    const { rowCount, schema, prompt, seed } = requestBody;
    const rows = Math.min(Math.max(10, rowCount || 10), 100);

    // If no OpenAI key is set, use the intelligent thematic fallback generator
    if (!process.env.OPENAI_API_KEY) {
      const fallback = generateFallbackThemedDataset(prompt || '', rows, schema);
      return NextResponse.json(fallback);
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let llmPrompt = `You are a Database Systems professor. Generate a sample dataset of exactly ${rows} rows specifically tailored for teaching students about Bitmap Indexing.
Important: Bitmap indexes excel at low-cardinality categorical data (e.g. 2 to 6 unique values per column).
`;

    const schemaColNames = schema && Array.isArray(schema) && schema.length > 0 
      ? schema.map((c: any) => c.name).filter(Boolean)
      : [];

    const genericColNames = schemaColNames.filter(name => isGenericColumnName(name));
    const establishedColNames = schemaColNames.filter(name => !isGenericColumnName(name));

    const p = (prompt || '').trim();
    const isAddColumnRequest = /add\s+(?:a\s+)?column|include\s+(?:a\s+)?column/i.test(p);

    if (p !== '') {
      if (isAddColumnRequest && schemaColNames.length > 0) {
        llmPrompt += `
THE USER CURRENTLY HAS THESE ESTABLISHED COLUMNS: [${establishedColNames.join(', ')}].
THE USER REQUESTED TO ADD A COLUMN: "${p}".
You MUST RETAIN all established columns [${establishedColNames.join(', ')}], and ADD the new column(s).
If any column has a generic placeholder name (like ${genericColNames.join(', ') || 'Column 4'}), you MUST RENAME it to a realistic, meaningful domain attribute.
Generate realistic, low-cardinality values for all columns.
`;
      } else {
        llmPrompt += `
THE USER REQUESTED THIS SPECIFIC THEME / CONTEXT: "${p}".
`;
        if (schemaColNames.length > 0) {
          llmPrompt += `
If existing columns [${schemaColNames.join(', ')}] fit this context, retain them.
If any column has a generic placeholder name (like ${genericColNames.join(', ') || 'Column 4'}), you MUST RENAME it to a realistic attribute matching "${p}".
`;
        } else {
          llmPrompt += `
Create 3 to 5 realistic, low-cardinality column names that directly match "${p}".
`;
        }
      }
    } else if (genericColNames.length > 0) {
      llmPrompt += `
THE USER CURRENTLY HAS THESE ESTABLISHED COLUMNS IN THE SCHEMA: [${establishedColNames.join(', ')}].
THE USER ALSO ADDED ${genericColNames.length} NEW COLUMN(S) WITH GENERIC PLACEHOLDER NAMES: [${genericColNames.join(', ')}].
CRITICAL REQUIREMENT:
1. You MUST RETAIN all established columns: [${establishedColNames.join(', ')}].
2. For each generic placeholder column in [${genericColNames.join(', ')}], you MUST RENAME IT to a realistic, meaningful, and contextually relevant column name that naturally belongs in this exact domain alongside [${establishedColNames.join(', ')}].
   - For example, if existing columns are [Department, Year, Hostel], a relevant 4th column MUST be named something like "Campus", "Degree", "Semester", "Scholarship", "Major", or "Club".
   - If existing columns are [Ward, BloodGroup, Insurance], a relevant column should be "RoomType", "Severity", or "DoctorRole".
   - If existing columns are [Airline, CabinClass, Terminal], a relevant column should be "FlightStatus", "Gate", or "MealPreference".
3. NEVER KEEP GENERIC NAMES LIKE "${genericColNames.join('", "')}". Always rename them to professional domain attributes.
4. Generate realistic, low-cardinality categorical values for all columns, including the renamed column(s).
`;
    } else if (schemaColNames.length > 0) {
      llmPrompt += `
THE USER DEFINED THE FOLLOWING COLUMNS IN THE SCHEMA: [${schemaColNames.join(', ')}].
You MUST generate data for THESE EXACT COLUMNS: [${schemaColNames.join(', ')}].
Do NOT replace or rename them. Generate realistic, meaningful low-cardinality categorical values for each of these columns.
`;
    } else {
      llmPrompt += `
Create 3 or 4 engaging categorical columns for an interesting domain (e.g. Hospital, E-commerce, University, Flight Operations).
`;
    }

    llmPrompt += `
Each column must contain realistic, human-readable categorical string values (e.g. 'ICU', 'General', 'A+', 'Yes', 'No', etc).
Include an "id" column starting from 1 to ${rows}.
Random nonce: ${seed || Math.random()}.

Return ONLY valid JSON with this exact structure:
{
  "domain": "Descriptive Domain Name",
  "columns": [
    { "name": "ColumnName1", "cardinality": 4, "distribution": "Uniform" },
    { "name": "ColumnName2", "cardinality": 3, "distribution": "Random" },
    { "name": "ColumnName3", "cardinality": 2, "distribution": "Uniform" }
  ],
  "dataset": [
    { "id": "1", "ColumnName1": "ValA", "ColumnName2": "ValX", "ColumnName3": "Yes" }
  ]
}
Do not wrap in markdown quotes. Return strictly valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: llmPrompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content?.trim() || "{}";
    const jsonStr = content.replace(/^```json/i, '').replace(/```$/i, '').trim();

    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.warn("Failed to parse JSON from AI, falling back", e);
      return NextResponse.json(generateFallbackThemedDataset(prompt || '', rows, schema));
    }

    let dataset: any[] = [];
    let columns: ColumnDef[] = [];
    let domain: string = parsed.domain || prompt || 'AI Generated Dataset';

    if (Array.isArray(parsed)) {
      dataset = parsed;
    } else if (Array.isArray(parsed.dataset)) {
      dataset = parsed.dataset;
      columns = parsed.columns || [];
    } else if (parsed.rows && Array.isArray(parsed.rows)) {
      dataset = parsed.rows;
      columns = parsed.columns || [];
    }

    if (dataset.length === 0) {
      return NextResponse.json(generateFallbackThemedDataset(prompt || '', rows, schema));
    }

    // Fall-safe check: If any column from LLM still has a generic placeholder name, rename it
    const anyStillGeneric = columns.some(c => isGenericColumnName(c.name)) || 
      (dataset.length > 0 && Object.keys(dataset[0]).some(k => k !== 'id' && isGenericColumnName(k)));

    if (anyStillGeneric) {
      const colsToProcess = columns.length > 0 ? columns : Object.keys(dataset[0]).filter(k => k !== 'id').map(name => ({ name }));
      const { domain: infDomain, renamedColumns } = inferDomainAndRenameColumns(colsToProcess);
      domain = parsed.domain || infDomain;

      const renameMap = new Map<string, string>();
      colsToProcess.forEach((oldCol, idx) => {
        if (renamedColumns[idx] && oldCol.name !== renamedColumns[idx].name) {
          renameMap.set(oldCol.name, renamedColumns[idx].name);
        }
      });

      columns = renamedColumns;

      if (renameMap.size > 0) {
        dataset = dataset.map((row: any) => {
          const newRow: any = { ...row };
          for (const [oldName, newName] of renameMap.entries()) {
            if (newRow[oldName] !== undefined) {
              const val = newRow[oldName];
              delete newRow[oldName];
              if (typeof val === 'string' && isGenericColumnName(val.replace(/\s+[A-Za-z0-9]+$/, ''))) {
                const opts = getOptionsForColumn(newName);
                newRow[newName] = opts[Math.floor(Math.random() * opts.length)];
              } else {
                newRow[newName] = val;
              }
            }
          }
          return newRow;
        });
      }
    }

    // Normalize rows: ensure id exists and all values are strings
    const sample = dataset[0] || {};
    const colKeys = Object.keys(sample).filter(k => k !== 'id');

    if (columns.length === 0) {
      columns = colKeys.map(k => {
        const distinct = new Set(dataset.map(r => r[k]));
        return {
          name: k,
          cardinality: distinct.size,
          distribution: 'Uniform'
        };
      });
    }

    const normalizedDataset = dataset.map((row: any, idx: number) => {
      const normalizedRow: any = { id: String(row.id || idx + 1) };
      colKeys.forEach(k => {
        normalizedRow[k] = String(row[k] !== undefined && row[k] !== null ? row[k] : 'N/A');
      });
      return normalizedRow;
    });

    return NextResponse.json({
      domain,
      columns,
      dataset: normalizedDataset
    });
  } catch (error) {
    console.error("OpenAI Generate Dataset Error:", error);
    const { rowCount, prompt, schema } = requestBody || {};
    return NextResponse.json(generateFallbackThemedDataset(prompt || '', rowCount || 25, schema));
  }
}
