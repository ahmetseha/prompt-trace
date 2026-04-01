import { Router } from 'express';
import { getProjects, getProjectById, getProjectStats } from '../../src/lib/db/queries';

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

    res.json({ project, stats });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});
