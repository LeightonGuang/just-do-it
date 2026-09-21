import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, dos, projects } from "../../../../db/schema";

import type { Column, Do, Project } from "../../../../db/schema";

export type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: Do[];
};

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = projectResult[0];

  const projectColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.project_id, projectId))
    .orderBy(columns.position);

  const projectDos = await db
    .select()
    .from(dos)
    .where(eq(dos.project_id, projectId));

  const response: KanbanResponse = {
    project,
    columns: projectColumns,
    dos: projectDos,
  };

  return Response.json(response);
};
