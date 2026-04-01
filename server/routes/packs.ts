import { Router } from 'express';
import { getPromptPacks, getPromptPackById } from '../../src/lib/db/queries';

export const packsRouter = Router();

// GET /api/packs
packsRouter.get('/', async (_req, res) => {
  try {
    const packs = await getPromptPacks();
    res.json({ packs });
  } catch (error) {
    console.error('Failed to fetch packs:', error);
    res.status(500).json({ error: 'Failed to fetch packs' });
  }
});

// GET /api/packs/:id
packsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pack = await getPromptPackById(id);
    if (!pack) {
      return res.status(404).json({ error: 'Pack not found' });
    }
    res.json({ pack });
  } catch (error) {
    console.error('Failed to fetch pack:', error);
    res.status(500).json({ error: 'Failed to fetch pack' });
  }
});
