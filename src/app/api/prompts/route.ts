import { NextResponse } from 'next/server';
import { getPrompts } from '@/lib/db/queries';
import type { FilterState, PromptCategory } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: Partial<FilterState> = {};

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const category = searchParams.get('category');
    if (category) filters.categories = category.split(',') as PromptCategory[];

    const source = searchParams.get('source');
    if (source) filters.sourceIds = source.split(',');

    const project = searchParams.get('project');
    if (project) filters.projectIds = project.split(',');

    const model = searchParams.get('model');
    if (model) filters.models = model.split(',');

    const session = searchParams.get('session');
    if (session) filters.sessionIds = session.split(',');

    const sort = searchParams.get('sort') as FilterState['sortBy'] | null;
    if (sort) filters.sortBy = sort;

    const order = searchParams.get('order') as FilterState['sortOrder'] | null;
    if (order) filters.sortOrder = order;

    const page = searchParams.get('page');
    filters.page = page ? parseInt(page, 10) : 1;

    const limit = searchParams.get('limit');
    filters.pageSize = limit ? parseInt(limit, 10) : 50;

    const result = await getPrompts(filters);

    return NextResponse.json({
      prompts: result.prompts,
      total: result.total,
      page: filters.page,
      limit: filters.pageSize,
    });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 },
    );
  }
}
