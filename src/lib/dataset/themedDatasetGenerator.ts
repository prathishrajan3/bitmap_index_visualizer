export interface ColumnDef {
  name: string;
  type?: string;
  cardinality?: number;
  distribution?: string;
}

export const KNOWN_CATEGORICAL_GENERATORS: Record<string, string[]> = {
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

export function getOptionsForColumn(colName: string, cardinality: number = 3): string[] {
  const normalized = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (KNOWN_CATEGORICAL_GENERATORS[normalized]) {
    return KNOWN_CATEGORICAL_GENERATORS[normalized];
  }
  for (const [key, opts] of Object.entries(KNOWN_CATEGORICAL_GENERATORS)) {
    if (normalized.includes(key)) {
      return opts;
    }
  }
  // Clean fallback values
  return Array.from({ length: Math.max(2, Math.min(cardinality, 6)) }, (_, i) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return `${colName} ${letters[i] || (i + 1)}`;
  });
}

export function generateFallbackThemedDataset(prompt: string, rowCount: number, schemaColumns?: ColumnDef[]) {
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
