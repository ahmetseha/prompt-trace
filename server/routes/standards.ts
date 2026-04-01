import { Router } from 'express';
import { getStandards, getStandardById } from '../../src/lib/db/queries';

export const standardsRouter = Router();

// GET /api/standards
standardsRouter.get('/', async (_req, res) => {
  try {
    const standards = await getStandards();
    res.json({ standards });
  } catch (error) {
    console.error('Failed to fetch standards:', error);
    res.status(500).json({ error: 'Failed to fetch standards' });
  }
});

// GET /api/standards/:id
standardsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const standard = await getStandardById(id);
    if (!standard) {
      return res.status(404).json({ error: 'Standard not found' });
    }
    res.json({ standard });
  } catch (error) {
    console.error('Failed to fetch standard:', error);
    res.status(500).json({ error: 'Failed to fetch standard' });
  }
});
