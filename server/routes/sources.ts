import { Router } from 'express';
import { getSources } from '../../src/lib/db/queries';

export const sourcesRouter = Router();

sourcesRouter.get('/', async (req, res) => {
  try {
    const sources = await getSources();
    res.json({ sources });
  } catch (error) {
    console.error('Failed to fetch sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});
