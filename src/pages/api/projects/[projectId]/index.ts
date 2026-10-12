import { eq } from "drizzle-orm";
import type { APIRoute, APIContext } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, doTags, dos, projects, tags } from "../../../../db/schema";

import type { Column, Do, Project } from "../../../../db/schema";

export type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: (Do & {
    tags: {
      id: number;
      name: string;
      colour: string;
    }[];
  })[];
};

export const GET = (async (context: APIContext<{ projectId: string }, { projectId: string }>) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(context.params.projectId);

  if (!Number.isInteger(projectId)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  const projectResult = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (projectResult.length === 0) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const project = projectResult[0];

  const projectColumns = await db
    .select()
    .from(columns)
    .where(eq(columns.project_id, projectId))
    .orderBy(columns.position);

  const projectDos = await db
    .select({
      id: dos.id,
      title: dos.title,
      description: dos.description,
      column_id: dos.column_id,
      position: dos.position,
      start_at: dos.start_at,
      end_at: dos.end_at,
      created_at: dos.created_at,
      updated_at: dos.updated_at,
      project_id: dos.project_id,
    })
    .from(dos)
    .where(eq(dos.project_id, projectId))
    .all();

  const projectTags = await db
    .select({
      doId: doTags.do_id,
      id: tags.id,
      name: tags.name,
      colour: tags.colour,
    })
    .from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id));

  const dosWithTags = projectDos.map((doItem) => ({
    ...doItem,
    tags: projectTags
      .filter((tag) => tag.doId === doItem.id)
      .map(({ doId, ...tag }) => tag),
  }));

  const response: KanbanResponse = {
    project,
    columns: projectColumns,
    dos: dosWithTags,
  };

  return new Response(JSON.stringify(response));
}) satisfies APIRoute;

export const PATCH = (async (context: APIContext<{ projectId: string }, { projectId: string }>) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(context.params.projectId);

  if (!Number.isInteger(projectId)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  let body: {
    name?: unknown;
    colour?: unknown;
  };

  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;

  const colour = typeof body.colour === "string" ? body.colour : undefined;

  if (name === undefined && colour === undefined) {
    return new Response(JSON.stringify({ error: "Nothing to update" }), { status: 400 });
  }

  if (name !== undefined && !name) {
    return new Response(JSON.stringify({ error: "Title cannot be empty" }), { status: 400 });
  }

  const updates: Partial<Project> = {};

  if (name !== undefined) {
    updates.name = name;
  }

  if (colour !== undefined) {
    updates.colour = colour;
  }

  const result = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  if (result.length === 0) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(result[0]));
}) satisfies APIRoute;

export const DELETE = (async (context: APIContext<{ projectId: string }, { projectId: string }>) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(context.params.projectId);

  if (!Number.isInteger(projectId)) {
    return new Response(JSON.stringify({ error: "Invalid project ID" }), { status: 400 });
  }

  await db.delete(projects).where(eq(projects.id, projectId));

  return new Response(JSON.stringify({ success: true }));
}) satisfies APIRoute;