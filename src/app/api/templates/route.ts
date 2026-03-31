import { NextResponse } from 'next/server';
import { getTemplateCandidates } from '@/lib/db/queries';

export async function GET() {
  try {
    const templates = await getTemplateCandidates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}
