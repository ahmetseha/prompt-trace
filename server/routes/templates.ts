import { Router } from 'express';
import { getTemplateCandidates } from '../../src/lib/db/queries';

export const templatesRouter = Router();

templatesRouter.get('/', async (req, res) => {
  try {
    const templates = await getTemplateCandidates();
    res.json({ templates });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});
