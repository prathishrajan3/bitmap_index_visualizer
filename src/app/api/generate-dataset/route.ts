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
  weather: ['Sunny', 'Cloudy', 'Rainy', 'Stormy'],
  degree: ['B.Tech', 'B.Sc', 'M.Tech', 'MBA'],
  major: ['CS', 'DataScience', 'AI', 'Cybersecurity'],
  semester: ['Fall', 'Spring', 'Summer'],
  club: ['Robotics', 'Coding', 'Debate', 'Sports'],
  scholarship: ['Full', 'Partial', 'None'],
  attendance: ['High', 'Moderate', 'Low'],
  roomtype: ['ICU', 'General', 'Private', 'Semi-Private'],
  gate: ['Gate A1', 'Gate B3', 'Gate C5', 'Gate D2'],
  deliveryspeed: ['Standard', 'Express', 'SameDay'],
  region: ['North', 'South', 'East', 'West'],
  device: ['Mobile', 'Desktop', 'Tablet'],
  branch: ['Downtown', 'Uptown', 'WestEnd', 'Suburban']
};

export interface DomainProfile {
  domain: string;
  keywords: string[];
  candidateColumns: Array<{ name: string; options: string[]; cardinality: number; distribution: string }>;
}

export const DOMAIN_PROFILES: DomainProfile[] = [
  {
    domain: 'University Campus',
    keywords: ['department', 'year', 'hostel', 'student', 'faculty', 'campus', 'grade', 'university', 'college', 'degree', 'semester'],
    candidateColumns: [
      { name: 'Campus', options: ['North Campus', 'South Campus', 'Downtown', 'Tech Park'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Degree', options: ['B.Tech', 'B.Sc', 'M.Tech', 'MBA'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Scholarship', options: ['Full', 'Partial', 'None'], cardinality: 3, distribution: 'Random' },
      { name: 'Semester', options: ['Fall', 'Spring', 'Summer'], cardinality: 3, distribution: 'Cyclic' },
      { name: 'Club', options: ['Robotics', 'Coding', 'Debate', 'Sports'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Attendance', options: ['High', 'Moderate', 'Low'], cardinality: 3, distribution: 'Skewed' },
      { name: 'Grade', options: ['Grade A', 'Grade B', 'Grade C', 'Grade D'], cardinality: 4, distribution: 'Uniform' }
    ]
  },
  {
    domain: 'Hospital Patient Records',
    keywords: ['ward', 'severity', 'bloodgroup', 'insurance', 'patient', 'doctor', 'hospital', 'clinic', 'medical'],
    candidateColumns: [
      { name: 'RoomType', options: ['ICU', 'General', 'Private', 'Semi-Private'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Gender', options: ['Male', 'Female', 'Non-Binary'], cardinality: 3, distribution: 'Uniform' },
      { name: 'Risk', options: ['Low', 'Medium', 'High', 'Critical'], cardinality: 4, distribution: 'Skewed' },
      { name: 'Vaccinated', options: ['Yes', 'No'], cardinality: 2, distribution: 'Random' },
      { name: 'DischargeStatus', options: ['Admitted', 'Observation', 'Discharged'], cardinality: 3, distribution: 'Cyclic' }
    ]
  },
  {
    domain: 'Airport Flight Operations',
    keywords: ['airline', 'cabinclass', 'flightstatus', 'terminal', 'flight', 'airport', 'plane'],
    candidateColumns: [
      { name: 'Gate', options: ['Gate A1', 'Gate B3', 'Gate C5', 'Gate D2'], cardinality: 4, distribution: 'Uniform' },
      { name: 'LuggageCheck', options: ['Carry-On', 'Checked', 'Priority'], cardinality: 3, distribution: 'Random' },
      { name: 'MealPreference', options: ['Standard', 'Vegetarian', 'Vegan', 'Halal'], cardinality: 4, distribution: 'Uniform' },
      { name: 'BookingClass', options: ['Economy', 'Business', 'First'], cardinality: 3, distribution: 'Skewed' }
    ]
  },
  {
    domain: 'E-Commerce Orders',
    keywords: ['category', 'paymentmethod', 'membership', 'status', 'ecommerce', 'order', 'shop', 'retail'],
    candidateColumns: [
      { name: 'DeliverySpeed', options: ['Standard', 'Express', 'SameDay'], cardinality: 3, distribution: 'Uniform' },
      { name: 'Region', options: ['North', 'South', 'East', 'West'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Device', options: ['Mobile', 'Desktop', 'Tablet'], cardinality: 3, distribution: 'Random' },
      { name: 'DiscountTier', options: ['Gold', 'Silver', 'Bronze', 'None'], cardinality: 4, distribution: 'Skewed' }
    ]
  },
  {
    domain: 'Banking & Credit Analytics',
    keywords: ['accounttype', 'creditrating', 'loanapproved', 'risklevel', 'bank', 'finance', 'credit', 'loan'],
    candidateColumns: [
      { name: 'Branch', options: ['Downtown', 'Uptown', 'WestEnd', 'Suburban'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Occupation', options: ['Salaried', 'Self-Employed', 'Business', 'Retired'], cardinality: 4, distribution: 'Uniform' },
      { name: 'Collateral', options: ['Property', 'Securities', 'None'], cardinality: 3, distribution: 'Random' },
      { name: 'KYCStatus', options: ['Verified', 'Pending', 'ActionRequired'], cardinality: 3, distribution: 'Cyclic' }
    ]
  }
];

export function isGenericColumnName(name: string): boolean {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  return /^(column|col|newcolumn|new_column|new\s+column|attribute|field|dimension|customcol|custom_column)\s*[_ -]?\d*$/i.test(trimmed);
}

export function inferDomainAndRenameColumns(schemaColumns: ColumnDef[]): { domain: string; renamedColumns: ColumnDef[] } {
  const establishedCols = schemaColumns.filter(c => !isGenericColumnName(c.name));

  let bestProfile: DomainProfile = DOMAIN_PROFILES[0];
  let maxScore = -1;

  for (const profile of DOMAIN_PROFILES) {
    let score = 0;
    for (const estCol of establishedCols) {
      const colNorm = estCol.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (profile.keywords.some(kw => colNorm.includes(kw) || kw.includes(colNorm))) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestProfile = profile;
    }
  }

  const existingNamesLower = new Set(establishedCols.map(c => c.name.toLowerCase()));
  const candidateQueue = [...bestProfile.candidateColumns];

  const renamedColumns: ColumnDef[] = [];
  for (const col of schemaColumns) {
    if (isGenericColumnName(col.name)) {
      let chosenCandidate = candidateQueue.find(cand => !existingNamesLower.has(cand.name.toLowerCase()));
      if (!chosenCandidate) {
        const genericFallbacks = [
          { name: 'Campus', options: ['North Campus', 'South Campus', 'Downtown'], cardinality: 3, distribution: 'Uniform' },
          { name: 'Degree', options: ['B.Tech', 'B.Sc', 'M.Tech'], cardinality: 3, distribution: 'Uniform' },
          { name: 'Region', options: ['North', 'South', 'East', 'West'], cardinality: 4, distribution: 'Uniform' },
          { name: 'Priority', options: ['High', 'Medium', 'Low'], cardinality: 3, distribution: 'Uniform' },
          { name: 'Status', options: ['Active', 'Pending', 'Completed'], cardinality: 3, distribution: 'Cyclic' }
        ];
        chosenCandidate = genericFallbacks.find(cand => !existingNamesLower.has(cand.name.toLowerCase())) || {
          name: 'Category',
          options: ['Type A', 'Type B', 'Type C'],
          cardinality: 3,
          distribution: 'Uniform'
        };
      }

      existingNamesLower.add(chosenCandidate.name.toLowerCase());
      KNOWN_CATEGORICAL_GENERATORS[chosenCandidate.name.toLowerCase().replace(/[^a-z0-9]/g, '')] = chosenCandidate.options;

      renamedColumns.push({
        name: chosenCandidate.name,
        type: 'string',
        cardinality: col.cardinality || chosenCandidate.cardinality || 3,
        distribution: col.distribution || (chosenCandidate.distribution as any) || 'Uniform'
      });
    } else {
      renamedColumns.push({
        name: col.name,
        type: col.type || 'string',
        cardinality: col.cardinality || 3,
        distribution: col.distribution || 'Uniform'
      });
    }
  }

  return { domain: bestProfile.domain, renamedColumns };
}

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
  const hasGenericCols = hasExistingSchema && schemaColumns.some(c => isGenericColumnName(c.name));

  if (hasExistingSchema && (hasGenericCols || (!isAddColumnPrompt && (!p || pLower.includes('current') || pLower.includes('my column') || pLower.includes('schema'))))) {
    if (hasGenericCols) {
      const { domain: inferredDomain, renamedColumns } = inferDomainAndRenameColumns(schemaColumns);
      domain = inferredDomain;
      columns = renamedColumns;
    } else {
      domain = 'Custom Defined Schema';
      columns = schemaColumns.map(c => ({
        name: c.name,
        type: c.type || 'string',
        cardinality: c.cardinality || 3,
        distribution: c.distribution || 'Uniform'
      }));
    }
    columns.forEach(col => {
      generators[col.name] = getOptionsForColumn(col.name, col.cardinality);
    });
  } else if (hasExistingSchema && isAddColumnPrompt) {
    // User requested adding a column via prompt, e.g. "add a column for city" or generic "add a column"
    domain = 'Extended Schema';
    const match = p.match(/(?:add|include)\s+(?:a\s+)?column\s+(?:for\s+)?([a-zA-Z0-9_ ]+)/i);
    let addedColName = match && match[1] ? match[1].trim() : '';
    if (!addedColName || isGenericColumnName(addedColName)) {
      const { renamedColumns } = inferDomainAndRenameColumns([...schemaColumns, { name: 'Column' }]);
      const lastCol = renamedColumns[renamedColumns.length - 1];
      addedColName = lastCol ? lastCol.name : 'Category';
    }
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
