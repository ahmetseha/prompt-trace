import { Router } from 'express';
import {
  getPromptAnalysis,
  getPromptOutcomes,
  getPromptById,
  getSessionPrompts,
  getPrompts,
  getPromptFiles,
  savePromptOutcomes,
} from '../../src/lib/db/queries';
import { analyzeOutcomes } from '../../src/lib/analysis/outcomes';

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

    // Get session prompts
    const sessionPrompts = prompt.sessionId
      ? await getSessionPrompts(prompt.sessionId)
      : [];

    // Get all prompts in same project for repeat detection (efficiency)
    const projectFilter = prompt.projectId
      ? { projectIds: [prompt.projectId], page: 1, pageSize: 10000 }
      : { page: 1, pageSize: 10000 };
    const { prompts: allPrompts } = await getPrompts(projectFilter as any);

    // Get files touched by this prompt
    const promptFiles = await getPromptFiles(id);

    // Compute outcomes
    const outcome = analyzeOutcomes(prompt, sessionPrompts, allPrompts, promptFiles);

    // Save to DB
    await savePromptOutcomes(id, {
      fileChangeCount: outcome.fileChangeCount,
      followUpCount: outcome.followUpCount,
      sessionContinuationScore: outcome.sessionContinuationScore,
      repeatedLater: outcome.repeatedLater ? 1 : 0,
      abandonmentRisk: outcome.abandonmentRisk,
      outcomeSummaryJson: JSON.stringify(outcome.summary),
    });

    res.json({ outcomes: outcome });
  } catch (error) {
    console.error('Failed to fetch prompt outcomes:', error);
    res.status(500).json({ error: 'Failed to fetch prompt outcomes' });
  }
});
