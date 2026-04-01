import { Router } from 'express';
import { getProjects, getProjectById, getProjectStats, getPrompts, getSessions, getPromptFiles } from '../../src/lib/db/queries';

export const projectsRouter = Router();

projectsRouter.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await getProjectStats(project.id);
        return { ...project, stats };
      }),
    );
    res.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

projectsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProjectById(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const stats = await getProjectStats(id);
    const promptsResult = await getPrompts({ projectIds: [id] });
    const allSessions = await getSessions();
    const sessions = allSessions.filter(s => s.projectId === id);

    // Get files for prompts in this project
    const files = [];
    for (const p of promptsResult.prompts.slice(0, 50)) {
      const pFiles = await getPromptFiles(p.id);
      files.push(...pFiles);
    }

    res.json({ project, stats, prompts: promptsResult.prompts, sessions, files });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});
