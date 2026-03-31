import { NextResponse } from 'next/server';
import { getProjects, getProjectStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const projects = await getProjects();

    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await getProjectStats(project.id);
        return { ...project, stats };
      }),
    );

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 },
    );
  }
}
