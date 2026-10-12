import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, projects, dos } from "../../../../../../db/schema";

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);
  const columnId = Number(params.columnId);

  if (!Number.isInteger(projectId) || !Number.isInteger(columnId)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  // Get the project to check if this column belongs to it
  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  const column = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .limit(1);

  if (column.length === 0) {
    return new Response(JSON.stringify({ error: "Column not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(column[0]));
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);
  const columnId = Number(params.columnId);

  if (!Number.isInteger(projectId) || !Number.isInteger(columnId)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  let body: {
    name?: unknown;
    position?: number;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const position = body.position !== undefined ? Number(body.position) : undefined;

  if (name === undefined && position === undefined) {
    return new Response(JSON.stringify({ error: "Nothing to update" }), { status: 400 });
  }

  const updates: Partial<typeof columns.$inferInsert> = {};

  if (name !== undefined) {
    updates.name = name;
  }

  if (position !== undefined) {
    updates.position = position;
  }

  const result = await db
    .update(columns)
    .set(updates)
    .where(eq(columns.id, columnId))
    .returning();

  if (result.length === 0) {
    return new Response(JSON.stringify({ error: "Column not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(result[0]));
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const projectId = Number(params.projectId);
  const columnId = Number(params.columnId);

  if (!Number.isInteger(projectId) || !Number.isInteger(columnId)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
  }

  // Get the project to check if this column belongs to it
  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (project.length === 0) {
    return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
  }

  await db.delete(columns).where(eq(columns.id, columnId));

  // Also delete all DOs in this column
  await db.delete(dos).where(eq(dos.column_id, columnId));

  return new Response(JSON.stringify({ success: true }));
};