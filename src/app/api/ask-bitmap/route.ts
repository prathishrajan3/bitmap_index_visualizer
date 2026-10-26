import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ message: "AI Tutor has been retired in favor of the full-width workspace." });
}
