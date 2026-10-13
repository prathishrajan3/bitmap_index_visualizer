import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ColumnDef {
  name: string;
  type?: string;
  cardinality?: number;
  distribution?: string;
}

const KNOWN_CATEGORICAL_GENERATORS: Record<string, string[]> = {
  department: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Biotechnology'],
  dept: ['CS', 'EE', 'ME', 'CE', 'BT'],
  year: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  hostel: ['Yes', 'No'],
  campus: ['North Campus', 'South Campus', 'Downtown', 'Tech Park'],
  city: ['New York', 'London', 'Tokyo', 'San Francisco', 'Singapore'],
  country: ['USA', 'UK', 'Germany', 'Japan', 'India'],
  location: ['Building A', 'Building B', 'Building C', 'Building D'],
  gender: ['Male', 'Female', 'Non-Binary'],
  bloodgroup: ['A+', 'B+', 'O+', 'AB+'],
  blood_group: ['A+', 'B+', 'O+', 'AB+'],
  ward: ['General', 'ICU', 'Emergency', 'Cardiology'],
  severity: ['Mild', 'Moderate', 'Critical'],
  risk: ['Low', 'Medium', 'High', 'Critical'],
  risklevel: ['Low', 'Medium', 'High', 'Critical'],
  insurance: ['Covered', 'Not Covered'],
  grade: ['Grade A', 'Grade B', 'Grade C', 'Grade D'],
  status: ['Active', 'Pending', 'Completed', 'Suspended'],
  role: ['Student', 'Faculty', 'Staff', 'Researcher'],
  category: ['Electronics', 'Apparel', 'Books', 'HomeGoods'],
  paymentmethod: ['CreditCard', 'UPI', 'PayPal', 'NetBanking'],
  payment: ['CreditCard', 'DebitCard', 'Cash', 'Online'],
  membership: ['Standard', 'Silver', 'Gold', 'Platinum'],
  tier: ['Tier-1', 'Tier-2', 'Tier-3'],
  priority: ['High', 'Medium', 'Low'],
  airline: ['AeroSky', 'GlobalAir', 'PacificJet', 'NovaAir'],
  cabinclass: ['Economy', 'Premium', 'Business', 'First'],
  flightstatus: ['On-Time', 'Delayed', 'Boarding'],
  terminal: ['T1', 'T2', 'T3'],
  accounttype: ['Savings', 'Checking', 'Corporate'],
  creditrating: ['Excellent', 'Good', 'Fair'],
  loanapproved: ['Yes', 'No'],
  shift: ['Morning', 'Evening', 'Night'],
  division: ['Engineering', 'Marketing', 'Operations', 'Finance'],
  traffic: ['Light', 'Moderate', 'Heavy', 'Severe'],
  weather: ['Sunny', 'Cloudy', 'Rainy', 'Stormy']
};

function getOptionsForColumn(colName: string, cardinality: number = 3): string[] {
  const normalized = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (KNOWN_CATEGORICAL_GENERATORS[normalized]) {
    return KNOWN_CATEGORICAL_GENERATORS[normalized];
  }
  for (const [key, opts] of Object.entries(KNOWN_CATEGORICAL_GENERATORS)) {
    if (normalized.includes(key)) {
      return opts;
    }
  }
  // Generic but clean and professional categorical values
  return Array.from({ length: Math.max(2, Math.min(cardinality, 6)) }, (_, i) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return `${colName} ${letters[i] || (i + 1)}`;
  });
}

// Fallback generator when OPENAI_API_KEY is not set or network fails
function generateFallbackThemedDataset(prompt: string, rowCount: number, schemaColumns?: ColumnDef[]) {
  const p = (prompt || '').trim();
  const pLower = p.toLowerCase();
  let domain = 'Synthetic Laboratory';
  let columns: ColumnDef[] = [];
  let generators: Record<string, string[]> = {};

  const hasExistingSchema = schemaColumns && Array.isArray(schemaColumns) && schemaColumns.length > 0;
  const isAddColumnPrompt = /add\s+(?:a\s+)?column|include\s+(?:a\s+)?column/i.test(pLower);

  if (hasExistingSchema && !isAddColumnPrompt && (!p || pLower.includes('current') || pLower.includes('my column') || pLower.includes('schema'))) {
    // Generate data respecting the user's existing/added schema columns directly
    domain = 'Custom Defined Schema';
    columns = schemaColumns.map(c => ({
      name: c.name,
      type: c.type || 'string',
      cardinality: c.cardinality || 3,
      distribution: c.distribution || 'Uniform'
    }));
    columns.forEach(col => {
      generators[col.name] = getOptionsForColumn(col.name, col.cardinality);
    });
  } else if (hasExistingSchema && isAddColumnPrompt) {
    // User requested adding a column via prompt, e.g. "add a column for city"
    domain = 'Extended Schema';
    const match = p.match(/(?:add|include)\s+(?:a\s+)?column\s+(?:for\s+)?([a-zA-Z0-9_ ]+)/i);
    const addedColName = match && match[1] ? match[1].trim() : 'NewColumn';
    const cleanedAddedName = addedColName.charAt(0).toUpperCase() + addedColName.slice(1);

    columns = schemaColumns.map(c => ({
      name: c.name,
      type: c.type || 'string',
      cardinality: c.cardinality || 3,
      distribution: c.distribution || 'Uniform'
    }));

    if (!columns.some(c => c.name.toLowerCase() === cleanedAddedName.toLowerCase())) {
      columns.push({
        name: cleanedAddedName,
        type: 'string',
        cardinality: 3,
        distribution: 'Uniform'
      });
    }

    columns.forEach(col => {
      generators[col.name] = getOptionsForColumn(col.name, col.cardinality);
    });
  } else if (pLower.includes('hospital') || pLower.includes('patient') || pLower.includes('doctor') || pLower.includes('medical') || pLower.includes('clinic')) {
    domain = 'Hospital Patient Records';
    columns = [
      { name: 'Ward', cardinality: 4, distribution: 'Uniform' },
      { name: 'BloodGroup', cardinality: 4, distribution: 'Uniform' },
      { name: 'Insurance', cardinality: 2, distribution: 'Random' },
      { name: 'Severity', cardinality: 3, distribution: 'Skewed' }
    ];
    generators = {
      Ward: KNOWN_CATEGORICAL_GENERATORS.ward,
      BloodGroup: KNOWN_CATEGORICAL_GENERATORS.bloodgroup,
      Insurance: KNOWN_CATEGORICAL_GENERATORS.insurance,
      Severity: KNOWN_CATEGORICAL_GENERATORS.severity
    };
  } else if (pLower.includes('flight') || pLower.includes('airport') || pLower.includes('airline') || pLower.includes('plane')) {
    domain = 'Airport Flight Operations';
    columns = [
      { name: 'Airline', cardinality: 4, distribution: 'Uniform' },
      { name: 'CabinClass', cardinality: 3, distribution: 'Uniform' },
      { name: 'FlightStatus', cardinality: 3, distribution: 'Random' },
      { name: 'Terminal', cardinality: 3, distribution: 'Cyclic' }
    ];
    generators = {
      Airline: KNOWN_CATEGORICAL_GENERATORS.airline,
      CabinClass: KNOWN_CATEGORICAL_GENERATORS.cabinclass,
      FlightStatus: KNOWN_CATEGORICAL_GENERATORS.flightstatus,
      Terminal: KNOWN_CATEGORICAL_GENERATORS.terminal
    };
  } else if (pLower.includes('ecommerce') || pLower.includes('shop') || pLower.includes('order') || pLower.includes('store') || pLower.includes('retail')) {
    domain = 'E-Commerce Orders';
    columns = [
      { name: 'Category', cardinality: 4, distribution: 'Uniform' },
      { name: 'PaymentMethod', cardinality: 4, distribution: 'Uniform' },
      { name: 'Membership', cardinality: 3, distribution: 'Random' },
      { name: 'Status', cardinality: 3, distribution: 'Cyclic' }
    ];
    generators = {
      Category: KNOWN_CATEGORICAL_GENERATORS.category,
      PaymentMethod: KNOWN_CATEGORICAL_GENERATORS.paymentmethod,
      Membership: KNOWN_CATEGORICAL_GENERATORS.membership,
      Status: KNOWN_CATEGORICAL_GENERATORS.status
    };
  } else if (pLower.includes('bank') || pLower.includes('finance') || pLower.includes('loan') || pLower.includes('credit')) {
    domain = 'Banking & Credit Analytics';
    columns = [
      { name: 'AccountType', cardinality: 3, distribution: 'Uniform' },
      { name: 'CreditRating', cardinality: 3, distribution: 'Uniform' },
      { name: 'LoanApproved', cardinality: 2, distribution: 'Random' },
      { name: 'RiskLevel', cardinality: 3, distribution: 'Skewed' }
    ];
    generators = {
      AccountType: KNOWN_CATEGORICAL_GENERATORS.accounttype,
      CreditRating: KNOWN_CATEGORICAL_GENERATORS.creditrating,
      LoanApproved: KNOWN_CATEGORICAL_GENERATORS.loanapproved,
      RiskLevel: KNOWN_CATEGORICAL_GENERATORS.risklevel
    };
  } else if (hasExistingSchema) {
    // Default to existing schema columns if provided
    domain = p || 'Custom Defined Schema';
    columns = schemaColumns.map(c => ({
      name: c.name,
      type: c.type || 'string',
      cardinality: c.cardinality || 3,
      distribution: c.distribution || 'Uniform'
    }));
    columns.forEach(col => {
      generators[col.name] = getOptionsForColumn(col.name, col.cardinality);
    });
  } else {
    domain = 'University Campus';
    columns = [
      { name: 'Department', cardinality: 4, distribution: 'Uniform' },
      { name: 'Year', cardinality: 4, distribution: 'Cyclic' },
      { name: 'Hostel', cardinality: 2, distribution: 'Random' },
      { name: 'Campus', cardinality: 3, distribution: 'Uniform' }
    ];
    generators = {
      Department: KNOWN_CATEGORICAL_GENERATORS.department,
      Year: KNOWN_CATEGORICAL_GENERATORS.year,
      Hostel: KNOWN_CATEGORICAL_GENERATORS.hostel,
      Campus: KNOWN_CATEGORICAL_GENERATORS.campus
    };
  }

  const dataset: any[] = [];
  for (let i = 1; i <= rowCount; i++) {
    const row: any = { id: String(i) };
    columns.forEach(col => {
      const options = generators[col.name] || getOptionsForColumn(col.name, col.cardinality);
      row[col.name] = options[Math.floor(Math.random() * options.length)];
    });
    dataset.push(row);
  }

  return { domain, columns, dataset };
}

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let llmPrompt = `You are a Database Systems professor. Generate a sample dataset of exactly ${rows} rows specifically tailored for teaching students about Bitmap Indexing.
Important: Bitmap indexes excel at low-cardinality categorical data (e.g. 2 to 6 unique values per column).
`;

    const schemaColNames = schema && Array.isArray(schema) && schema.length > 0 
      ? schema.map((c: any) => c.name).filter(Boolean)
      : [];

    const p = (prompt || '').trim();
    const isAddColumnRequest = /add\s+(?:a\s+)?column|include\s+(?:a\s+)?column/i.test(p);

    if (p !== '') {
      if (isAddColumnRequest && schemaColNames.length > 0) {
        llmPrompt += `
THE USER CURRENTLY HAS THESE COLUMNS IN THEIR SCHEMA: [${schemaColNames.join(', ')}].
THE USER REQUESTED: "${p}".
You MUST RETAIN all existing columns [${schemaColNames.join(', ')}], and ADD the new column(s) requested by the user.
Generate realistic, low-cardinality values for all columns.
`;
      } else {
        llmPrompt += `
THE USER REQUESTED THIS SPECIFIC THEME / CONTEXT: "${p}".
`;
        if (schemaColNames.length > 0) {
          llmPrompt += `
If existing columns [${schemaColNames.join(', ')}] fit this context, retain or adapt them. Otherwise, create 3 to 5 realistic, low-cardinality column names that directly match "${p}".
`;
        } else {
          llmPrompt += `
Create 3 to 5 realistic, low-cardinality column names that directly match "${p}".
`;
        }
      }
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
