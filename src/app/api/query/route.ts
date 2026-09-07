import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    
    // Only allow SELECT queries for safety
    if (!query.toLowerCase().trim().startsWith('select')) {
       return NextResponse.json({ error: "Only SELECT queries are allowed for security reasons." }, { status: 403 });
    }

    const startTime = performance.now();
    // Execute the raw query
    const results = await prisma.$queryRawUnsafe(query);
    const endTime = performance.now();

    return NextResponse.json({ 
      results,
      executionTimeMs: Math.round(endTime - startTime)
    });

  } catch (error: any) {
    console.error("Database Query Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute query" }, { status: 500 });
  }
}
