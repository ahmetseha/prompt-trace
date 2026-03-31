import { NextResponse } from 'next/server';
import { searchAll } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ prompts: [], sessions: [], projects: [] });
    }

    const results = await searchAll(q.trim());
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 },
    );
  }
}
