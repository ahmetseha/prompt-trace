import { Router } from 'express';
import { searchAll } from '../../src/lib/db/queries';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  try {
    const q = req.query.q as string | undefined;

    if (!q || q.trim().length === 0) {
      return res.json({ prompts: [], sessions: [], projects: [] });
    }

    const results = await searchAll(q.trim());
    res.json(results);
  } catch (error) {
    console.error('Failed to search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
