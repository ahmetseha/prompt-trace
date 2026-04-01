import { Router } from 'express';
import { getOptimizationOpportunities } from '../../src/lib/db/queries';

export const overviewRouter = Router();

// GET /api/overview/opportunities
overviewRouter.get('/opportunities', async (_req, res) => {
  try {
    const opportunities = await getOptimizationOpportunities();
    res.json(opportunities);
  } catch (error) {
    console.error('Failed to fetch optimization opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch optimization opportunities' });
  }
});
