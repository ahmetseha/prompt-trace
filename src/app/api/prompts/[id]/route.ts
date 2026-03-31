import { NextResponse } from 'next/server';
import { getPromptById, getPromptFiles, getPromptTags, getRelatedPrompts } from '@/lib/db/queries';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const prompt = await getPromptById(id);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const [files, tags, related] = await Promise.all([
      getPromptFiles(id),
      getPromptTags(id),
      getRelatedPrompts(id),
    ]);

    return NextResponse.json({ prompt, files, tags, related });
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt' },
      { status: 500 },
    );
  }
}
