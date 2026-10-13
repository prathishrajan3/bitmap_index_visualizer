import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function inferPostgresType(colName: string, declaredType: string | undefined, dataset: any[]): string {
  const colKey = colName.toLowerCase();
  
  const values: any[] = [];
  for (const row of dataset) {
    if (!row || typeof row !== 'object') continue;
    const val = row[colKey] !== undefined ? row[colKey] : row[colName];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      values.push(val);
    }
  }

  // If no values exist in the dataset, fall back to declared type
  if (values.length === 0) {
    if (declaredType === 'number') return 'int';
    if (declaredType === 'boolean') return 'boolean';
    return 'text';
  }

  // Check if all values are strictly boolean primitives or boolean string representations ('true'/'false')
  const allBooleans = values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
  if (allBooleans && (declaredType === 'boolean' || values.every(v => typeof v === 'boolean'))) {
    return 'boolean';
  }

  // Check if all values are strictly integers
  const allIntegers = values.every(v => {
    if (typeof v === 'number') return Number.isInteger(v);
    if (typeof v === 'string') {
      const trimmed = v.trim();
      return /^-?\d+$/.test(trimmed);
    }
    return false;
  });

  if (allIntegers && (declaredType === 'number' || values.every(v => typeof v === 'number'))) {
    return 'int';
  }

  // Check if all values are floating point numbers
  const allFloats = values.every(v => {
    if (typeof v === 'number') return !isNaN(v);
    if (typeof v === 'string') {
      const trimmed = v.trim();
      return /^-?\d+(\.\d+)?$/.test(trimmed);
    }
    return false;
  });

  if (allFloats && declaredType === 'number') {
    return 'numeric';
  }

  // Fallback to text for all categorical strings, alphanumeric values ("1st Year", "Year_1", "Yes", "No", etc.)
  return 'text';
}

export function buildCteQuery(query: string, dataset: any[], schema?: any[]): { finalQuery: string; params: any[] } {
  if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
    return { finalQuery: query, params: [] };
  }

  // Lowercase keys to match jsonb_to_recordset expectations safely without quotes
  const lowercaseDataset = dataset.map((row: any, idx: number) => {
    const newRow: any = {};
    for (const [k, v] of Object.entries(row)) {
      newRow[k.toLowerCase()] = v;
    }
    if (newRow.id === undefined || isNaN(Number(newRow.id))) {
      newRow.id = idx + 1;
    } else {
      newRow.id = Number(newRow.id);
    }
    return newRow;
  });

  const jsonPayload = JSON.stringify(lowercaseDataset);

  const colMap = new Map<string, { name: string; type?: string }>();

  if (Array.isArray(schema)) {
    for (const c of schema) {
      if (c && c.name && c.name.toLowerCase() !== 'id') {
        colMap.set(c.name.toLowerCase(), c);
      }
    }
  }

  if (dataset.length > 0 && typeof dataset[0] === 'object') {
    for (const key of Object.keys(dataset[0])) {
      const kLower = key.toLowerCase();
      if (kLower !== 'id' && !colMap.has(kLower)) {
        colMap.set(kLower, { name: key, type: 'string' });
      }
    }
  }

  const columnDefs = Array.from(colMap.values())
    .map(c => {
      const pgType = inferPostgresType(c.name, c.type, dataset);
      return `${c.name.toLowerCase()} ${pgType}`;
    })
    .join(', ');

  const colsSql = columnDefs.length > 0 ? `, ${columnDefs}` : '';

  // Normalize any quoted "DatasetRow" references in user query
  const normalizedQuery = query.replace(/FROM\s+"DatasetRow"/gi, 'FROM DatasetRow');

  const finalQuery = `
    WITH DatasetRow AS (
      SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id int${colsSql})
    )
    ${normalizedQuery}
  `;

  return { finalQuery, params: [jsonPayload] };
}

export async function POST(req: Request) {
  try {
    const { query, dataset, schema } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    
    // Only allow SELECT queries for safety
    if (!query.toLowerCase().trim().startsWith('select')) {
       return NextResponse.json({ error: "Only SELECT queries are allowed for security reasons." }, { status: 403 });
    }

    const { finalQuery, params } = buildCteQuery(query, dataset, schema);

    const startTime = performance.now();
    // Execute the raw query
    const results = await prisma.$queryRawUnsafe(finalQuery, ...params);
    const endTime = performance.now();

    // Convert BigInt to string to prevent JSON serialization errors
    const safeResults = Array.isArray(results) ? results.map((row: any) => {
      const newRow: any = {};
      for (const key in row) {
        newRow[key] = typeof row[key] === 'bigint' ? row[key].toString() : row[key];
      }
      return newRow;
    }) : results;

    const elapsed = endTime - startTime;
    const executionTimeMs = Number(elapsed.toFixed(3));

    return NextResponse.json({ 
      results: safeResults,
      executionTimeMs: executionTimeMs > 0 ? executionTimeMs : 0.001
    });

  } catch (error: any) {
    console.error("Database Query Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute query" }, { status: 500 });
  }
}
