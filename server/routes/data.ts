import { Router } from 'express';
import { db } from '../../src/lib/db';
import * as schema from '../../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export const dataRouter = Router();

dataRouter.get('/', async (req, res) => {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'prompttrace.db');
    let dbSize = 0;
    try {
      const stat = fs.statSync(dbPath);
      dbSize = stat.size;
    } catch {
      // DB file may not exist yet
    }

    const promptCount =
      db.select({ count: sql<number>`count(*)` }).from(schema.prompts).get()
        ?.count ?? 0;
    const sessionCount =
      db.select({ count: sql<number>`count(*)` }).from(schema.sessions).get()
        ?.count ?? 0;
    const projectCount =
      db.select({ count: sql<number>`count(*)` }).from(schema.projects).get()
        ?.count ?? 0;
    const sourceCount =
      db.select({ count: sql<number>`count(*)` }).from(schema.sources).get()
        ?.count ?? 0;

    res.json({
      dbSize,
      dbSizeFormatted:
        dbSize > 1024 * 1024
          ? `${(dbSize / (1024 * 1024)).toFixed(1)} MB`
          : `${(dbSize / 1024).toFixed(1)} KB`,
      counts: {
        prompts: promptCount,
        sessions: sessionCount,
        projects: projectCount,
        sources: sourceCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to get data info: ${message}` });
  }
});

dataRouter.delete('/', async (req, res) => {
  try {
    // Delete in correct order to respect foreign keys
    db.delete(schema.promptTags).run();
    db.delete(schema.promptFiles).run();
    db.delete(schema.templateCandidates).run();
    db.delete(schema.prompts).run();
    db.delete(schema.sessions).run();
    db.delete(schema.projects).run();
    db.delete(schema.sources).run();

    res.json({ success: true, message: 'All data cleared' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to clear data: ${message}` });
  }
});
