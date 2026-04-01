import { Router } from 'express';
import { getSessions, getSessionById, getSessionPrompts } from '../../src/lib/db/queries';

export const sessionsRouter = Router();

sessionsRouter.get('/', async (req, res) => {
  try {
    const sessions = await getSessions();
    res.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

sessionsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const prompts = await getSessionPrompts(id);

    res.json({ session, prompts });
  } catch (error) {
    console.error('Failed to fetch session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});
