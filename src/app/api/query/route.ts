import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    let finalQuery = query;
    let params: any[] = [];

    // If dataset and schema are provided, rewrite query to use CTE with jsonb_to_recordset
    if (dataset && schema && schema.length > 0) {
      // Lowercase keys to match jsonb_to_recordset expectations safely without quotes
      // We will define the CTE columns without quotes so Postgres folds them to lowercase.
      // Therefore, the JSON object must also have lowercase keys.
      const lowercaseDataset = dataset.map((row: any) => {
        const newRow: any = {};
        for (const [k, v] of Object.entries(row)) {
          newRow[k.toLowerCase()] = v;
        }
        return newRow;
      });

      const jsonPayload = JSON.stringify(lowercaseDataset);
      
      const getPgType = (jsType: string) => {
        if (jsType === 'number') return 'int';
        if (jsType === 'boolean') return 'boolean';
        return 'text';
      };
      
      const columnDefs = schema.map((c: any) => `${c.name.toLowerCase()} ${getPgType(c.type)}`).join(', ');
      
      finalQuery = `
        WITH DatasetRow AS (
          SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id int, ${columnDefs})
        )
        ${query}
      `;
      params = [jsonPayload];
    }

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

    return NextResponse.json({ 
      results: safeResults,
      executionTimeMs: Math.round(endTime - startTime)
    });

  } catch (error: any) {
    console.error("Database Query Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute query" }, { status: 500 });
  }
}
