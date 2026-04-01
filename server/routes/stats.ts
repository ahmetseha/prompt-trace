import { Router } from 'express';
import { getDashboardStats } from '../../src/lib/db/queries';

export const statsRouter = Router();

statsRouter.get('/', async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});
