import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, projects } from "../../../../../db/schema";

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const projectColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.project_id, projectId))
    .orderBy(columns.position);

  return Response.json(projectColumns);
};
