import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getRandomSmartQuery, SMART_CITY_QUERY_POOL } from '@/lib/city/smartQueryPool';

export async function POST(req: Request) {
  try {
    let excludeText = '';
    let summary: any = null;

    try {
      const body = await req.json();
      excludeText = body.currentQuery || body.excludeText || '';
      summary = body.summary;
    } catch {
      // Body parsing optional
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('dummy')) {
      try {
        const openai = new OpenAI({ apiKey });
        const userMessage = `You are a Smart City Data Analyst for Nova City.
Generate ONE natural language question about the smart city digital twin (e.g., finding severe traffic, road blocks, accidents, critical hospital load, poor air quality, or power substations across districts like Central Business District, North Industrial Zone, East Transit Hub, etc.).
Make it sound like a real municipal operations query.
Do NOT output any markdown, punctuation quotes, or explanations. Only output the plain question string.`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You only output a single natural language query for smart city analytics.' },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.9,
        });

        const generated = response.choices[0].message.content?.replace(/^["']|["']$/g, '').trim();
        if (generated && generated.length > 5) {
          return NextResponse.json({ 
            query: generated,
            source: 'ai_dynamic',
            totalAvailableInPool: SMART_CITY_QUERY_POOL.length
          });
        }
      } catch (err) {
        console.warn('OpenAI query suggestion failed, falling back to 100-query pool:', err);
      }
    }

    // Always serve from our curated 100-query smart city pool
    const selected = getRandomSmartQuery(excludeText);
    return NextResponse.json({ 
      query: selected.text,
      category: selected.category,
      description: selected.description,
      ast: selected.ast,
      totalAvailableInPool: SMART_CITY_QUERY_POOL.length
    });

  } catch (error) {
    console.error("Suggest City Query Error:", error);
    const fallback = getRandomSmartQuery();
    return NextResponse.json({ 
      query: fallback.text,
      category: fallback.category,
      ast: fallback.ast,
      totalAvailableInPool: SMART_CITY_QUERY_POOL.length
    });
  }
}
