import { Router } from 'express';
import { ingestSource } from '../../src/lib/adapters/ingest';
import { discoverSources } from '../../src/lib/adapters/runner';

export const ingestRouter = Router();

ingestRouter.get('/', async (req, res) => {
  try {
    const sources = await discoverSources();
    res.json({ sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Discovery failed: ${message}` });
  }
});

ingestRouter.post('/', async (req, res) => {
  try {
    const { sourceType, basePath } = req.body as {
      sourceType: string;
      basePath?: string;
    };

    if (!sourceType) {
      return res.status(400).json({ error: 'sourceType is required' });
    }

    const result = await ingestSource(sourceType, basePath);

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Ingest failed: ${message}` });
  }
});
