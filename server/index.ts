import express from 'express';
import path from 'path';
import fs from 'fs';
import { statsRouter } from './routes/stats';
import { promptsRouter } from './routes/prompts';
import { sessionsRouter } from './routes/sessions';
import { projectsRouter } from './routes/projects';
import { templatesRouter } from './routes/templates';
import { sourcesRouter } from './routes/sources';
import { searchRouter } from './routes/search';
import { dataRouter } from './routes/data';
import { ingestRouter } from './routes/ingest';

const app = express();
app.use(express.json());

// API routes
app.use('/api/stats', statsRouter);
app.use('/api/prompts', promptsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/search', searchRouter);
app.use('/api/data', dataRouter);
app.use('/api/ingest', ingestRouter);

// Serve static files from Vite build
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
const indexFile = path.join(distPath, 'index.html');
let indexHtml = '';
try { indexHtml = fs.readFileSync(indexFile, 'utf-8'); } catch { /* will retry */ }

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  if (!indexHtml) {
    try { indexHtml = fs.readFileSync(indexFile, 'utf-8'); } catch { /* still building */ }
  }
  if (indexHtml) {
    res.setHeader('Content-Type', 'text/html');
    res.send(indexHtml);
  } else {
    res.status(200).send('<html><body style="background:#09090b;color:#a1a1aa;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui">Building dashboard... please refresh.</body></html>');
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`  Dashboard ready at http://localhost:${port}`);
});

export default app;
