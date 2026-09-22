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

  if (!Number.isInteger(projectId))
    return Response.json({ error: "Invalid ID" }, { status: 400 });

  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0)
    return Response.json({ error: "Project not found" }, { status: 404 });

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

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: {
    name?: unknown;
    colour?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  const colour = typeof body.colour === "string" ? body.colour : undefined;

  if (name === undefined && colour === undefined) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (name !== undefined && !name) {
    return Response.json({ error: "Title cannot be empty" }, { status: 400 });
  }

  const updates: Partial<Project> = {};

  if (name !== undefined) updates.name = name;

  if (colour !== undefined) updates.colour = colour;

  const result = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  if (result.length === 0) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  return Response.json(result[0]);
};
