import { Router } from 'express';
import { getPrompts, getPromptById, getPromptFiles, getPromptTags, getRelatedPrompts } from '../../src/lib/db/queries';
import type { FilterState, PromptCategory } from '../../src/lib/types';

export const promptsRouter = Router();

promptsRouter.get('/', async (req, res) => {
  try {
    const filters: Partial<FilterState> = {};

    const search = req.query.search as string | undefined;
    if (search) filters.search = search;

    const category = req.query.category as string | undefined;
    if (category) filters.categories = category.split(',') as PromptCategory[];

    const source = req.query.source as string | undefined;
    if (source) filters.sourceIds = source.split(',');

    const project = req.query.project as string | undefined;
    if (project) filters.projectIds = project.split(',');

    const model = req.query.model as string | undefined;
    if (model) filters.models = model.split(',');

    const session = req.query.session as string | undefined;
    if (session) filters.sessionIds = session.split(',');

    const sort = req.query.sort as FilterState['sortBy'] | undefined;
    if (sort) filters.sortBy = sort;

    const order = req.query.order as FilterState['sortOrder'] | undefined;
    if (order) filters.sortOrder = order;

    const page = req.query.page as string | undefined;
    filters.page = page ? parseInt(page, 10) : 1;

    const limit = req.query.limit as string | undefined;
    filters.pageSize = limit ? parseInt(limit, 10) : 50;

    const result = await getPrompts(filters);

    res.json({
      prompts: result.prompts,
      total: result.total,
      page: filters.page,
      limit: filters.pageSize,
    });
  } catch (error) {
    console.error('Failed to fetch prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

promptsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await getPromptById(id);

    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const [files, tags, related] = await Promise.all([
      getPromptFiles(id),
      getPromptTags(id),
      getRelatedPrompts(id),
    ]);

    res.json({ prompt, files, tags, related });
  } catch (error) {
    console.error('Failed to fetch prompt:', error);
    res.status(500).json({ error: 'Failed to fetch prompt' });
  }
});
