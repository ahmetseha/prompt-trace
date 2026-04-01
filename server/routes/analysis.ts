import { Router } from 'express';
import { getPromptAnalysis, getPromptOutcomes, getPromptById } from '../../src/lib/db/queries';

export const analysisRouter = Router();

// GET /api/prompts/:id/analysis
analysisRouter.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const analysis = await getPromptAnalysis(id);
    res.json({ analysis });
  } catch (error) {
    console.error('Failed to fetch prompt analysis:', error);
    res.status(500).json({ error: 'Failed to fetch prompt analysis' });
  }
});

// GET /api/prompts/:id/outcomes
analysisRouter.get('/:id/outcomes', async (req, res) => {
  try {
    const { id } = req.params;
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const outcomes = await getPromptOutcomes(id);
    res.json({ outcomes });
  } catch (error) {
    console.error('Failed to fetch prompt outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch prompt outcomes' });
  }
});
