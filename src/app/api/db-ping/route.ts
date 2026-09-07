import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Simply query a quick literal to keep the Neon database awake
    await prisma.$queryRawUnsafe('SELECT 1');
    return NextResponse.json({ status: "alive" });
  } catch (error: any) {
    console.error("Database Ping Error:", error);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
