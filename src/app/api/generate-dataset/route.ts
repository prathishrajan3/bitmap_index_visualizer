import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ColumnDef {
  name: string;
  type?: string;
  cardinality: number;
  distribution: string;
}

// Fallback generator when OPENAI_API_KEY is not set or network fails
function generateFallbackThemedDataset(prompt: string, rowCount: number) {
  const p = (prompt || '').toLowerCase();
  let domain = 'Synthetic Laboratory';
  let columns: ColumnDef[] = [];
  let generators: Record<string, string[]> = {};

  if (p.includes('hospital') || p.includes('patient') || p.includes('doctor') || p.includes('medical') || p.includes('clinic')) {
    domain = 'Hospital Patient Records';
    columns = [
      { name: 'Ward', cardinality: 4, distribution: 'Uniform' },
      { name: 'BloodGroup', cardinality: 4, distribution: 'Uniform' },
      { name: 'Insurance', cardinality: 2, distribution: 'Random' },
      { name: 'Severity', cardinality: 3, distribution: 'Skewed' }
    ];
    generators = {
      Ward: ['General', 'ICU', 'Emergency', 'Cardiology'],
      BloodGroup: ['A+', 'B+', 'O+', 'AB+'],
      Insurance: ['Yes', 'No'],
      Severity: ['Mild', 'Moderate', 'Critical']
    };
  } else if (p.includes('flight') || p.includes('airport') || p.includes('airline') || p.includes('plane')) {
    domain = 'Airport Flight Operations';
    columns = [
      { name: 'Airline', cardinality: 4, distribution: 'Uniform' },
      { name: 'CabinClass', cardinality: 3, distribution: 'Uniform' },
      { name: 'FlightStatus', cardinality: 3, distribution: 'Random' },
      { name: 'Terminal', cardinality: 3, distribution: 'Cyclic' }
    ];
    generators = {
      Airline: ['AeroSky', 'GlobalAir', 'PacificJet', 'NovaAir'],
      CabinClass: ['Economy', 'Business', 'First'],
      FlightStatus: ['On-Time', 'Delayed', 'Boarding'],
      Terminal: ['T1', 'T2', 'T3']
    };
  } else if (p.includes('ecommerce') || p.includes('shop') || p.includes('order') || p.includes('store') || p.includes('retail')) {
    domain = 'E-Commerce Orders';
    columns = [
      { name: 'Category', cardinality: 4, distribution: 'Uniform' },
      { name: 'PaymentMethod', cardinality: 3, distribution: 'Uniform' },
      { name: 'MemberTier', cardinality: 3, distribution: 'Random' },
      { name: 'DeliveryStatus', cardinality: 3, distribution: 'Cyclic' }
    ];
    generators = {
      Category: ['Electronics', 'Apparel', 'HomeGoods', 'Books'],
      PaymentMethod: ['CreditCard', 'UPI', 'PayPal'],
      MemberTier: ['Standard', 'Silver', 'Gold'],
      DeliveryStatus: ['Shipped', 'Delivered', 'Processing']
    };
  } else if (p.includes('bank') || p.includes('finance') || p.includes('loan') || p.includes('credit')) {
    domain = 'Banking & Credit Analytics';
    columns = [
      { name: 'AccountType', cardinality: 3, distribution: 'Uniform' },
      { name: 'CreditRating', cardinality: 3, distribution: 'Uniform' },
      { name: 'LoanApproved', cardinality: 2, distribution: 'Random' },
      { name: 'RiskLevel', cardinality: 3, distribution: 'Skewed' }
    ];
    generators = {
      AccountType: ['Savings', 'Checking', 'Corporate'],
      CreditRating: ['Excellent', 'Good', 'Fair'],
      LoanApproved: ['Yes', 'No'],
      RiskLevel: ['Low', 'Medium', 'High']
    };
  } else {
    // Custom words derived from the prompt if provided
    const words = prompt.trim().split(/\s+/).filter(w => w.length > 2);
    if (words.length >= 2) {
      domain = prompt.trim();
      const col1 = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      const col2 = words[1].charAt(0).toUpperCase() + words[1].slice(1);
      columns = [
        { name: col1, cardinality: 3, distribution: 'Uniform' },
        { name: col2, cardinality: 3, distribution: 'Uniform' },
        { name: 'Status', cardinality: 2, distribution: 'Random' }
      ];
      generators = {
        [col1]: ['Type-A', 'Type-B', 'Type-C'],
        [col2]: ['Tier-1', 'Tier-2', 'Tier-3'],
        Status: ['Active', 'Inactive']
      };
    } else {
      domain = 'Smart Enterprise';
      columns = [
        { name: 'Division', cardinality: 3, distribution: 'Uniform' },
        { name: 'Priority', cardinality: 3, distribution: 'Uniform' },
        { name: 'AccessLevel', cardinality: 3, distribution: 'Random' }
      ];
      generators = {
        Division: ['Engineering', 'Marketing', 'Operations'],
        Priority: ['High', 'Medium', 'Low'],
        AccessLevel: ['Tier-1', 'Tier-2', 'Tier-3']
      };
    }
  }

  const dataset: any[] = [];
  for (let i = 1; i <= rowCount; i++) {
    const row: any = { id: String(i) };
    columns.forEach(col => {
      const options = generators[col.name] || ['Option1', 'Option2', 'Option3'];
      row[col.name] = options[Math.floor(Math.random() * options.length)];
    });
    dataset.push(row);
  }

  return { domain, columns, dataset };
}

export async function POST(req: Request) {
  try {
    const { rowCount, schema, prompt, seed } = await req.json();
    const rows = Math.min(Math.max(10, rowCount || 10), 100);

    // If no OpenAI key is set, use the intelligent thematic fallback generator
    if (!process.env.OPENAI_API_KEY) {
      const fallback = generateFallbackThemedDataset(prompt || '', rows);
      return NextResponse.json(fallback);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let llmPrompt = `You are a Database Systems professor. Generate a sample dataset of exactly ${rows} rows specifically tailored for teaching students about Bitmap Indexing.
Important: Bitmap indexes excel at low-cardinality categorical data (e.g. 2 to 6 unique values per column).
`;

    if (prompt && prompt.trim() !== '') {
      llmPrompt += `
THE USER REQUESTED THIS SPECIFIC THEME / CONTEXT: "${prompt.trim()}".
You MUST create 3 or 4 realistic, low-cardinality column names that directly match this theme (for example, if Hospital: "Ward", "BloodGroup", "Insurance", "Severity"; if E-commerce: "Category", "PaymentMethod", "Membership", "Status").
Do NOT use generic or outdated column names like 'Department', 'Year', 'Hostel' unless they genuinely fit the theme. Adapt the column names to "${prompt.trim()}".
`;
    } else {
      const currentCols = schema ? schema.map((c: any) => c.name).join(', ') : 'Category, Status, Type';
      llmPrompt += `
Create 3 or 4 engaging categorical columns for an interesting domain (e.g. based on: ${currentCols} or a creative educational domain).
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
      return NextResponse.json(generateFallbackThemedDataset(prompt || '', rows));
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
      return NextResponse.json(generateFallbackThemedDataset(prompt || '', rows));
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
    // Graceful fallback so user always gets a working dataset matching their prompt
    const { rowCount, prompt } = await req.json().catch(() => ({ rowCount: 25, prompt: '' }));
    return NextResponse.json(generateFallbackThemedDataset(prompt || '', rowCount || 25));
  }
}
