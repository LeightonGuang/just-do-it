import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { dos, projects } from "../../../../../db/schema";

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  // Verify the project exists
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Fetch all DOs for this project with position and column info
  const projectDos = await db
    .select({
      id: dos.id,
      title: dos.title,
      description: dos.description,
      project_id: dos.project_id,
      column_id: dos.column_id,
      start_at: dos.start_at,
      end_at: dos.end_at,
      position: dos.position,
      created_at: dos.created_at,
      updated_at: dos.updated_at,
    })
    .from(dos)
    .where(eq(dos.project_id, projectId))
    .orderBy(dos.position);

  return Response.json(projectDos);
};