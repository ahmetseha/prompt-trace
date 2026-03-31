import { NextResponse } from 'next/server';
import { getSources } from '@/lib/db/queries';

export async function GET() {
  try {
    const sources = await getSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sources' },
      { status: 500 },
    );
  }
}
