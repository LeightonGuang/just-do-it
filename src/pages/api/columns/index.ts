import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, and } from "drizzle-orm";

import { columns, dos } from "../../../db/schema";

export const GET: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const name = url.searchParams.get("name");
  const projectId = url.searchParams.get("project_id");

  const conditions = [];

  if (name) conditions.push(like(columns.name, `%${name}%`));

  if (projectId) conditions.push(eq(columns.project_id, Number(projectId)));

  if (conditions.length > 0) {
    const result = await db
      .select()
      .from(columns)
      .where(and(...conditions));
    return Response.json(result);
  }

  const allColumns = await db.select().from(columns);
  return Response.json(allColumns);
};

export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    name?: string;
    project_id?: number;
    position?: number;
  };

  const name = body.name?.trim();
  const projectId = body.project_id;

  if (!name) {
    return Response.json({ error: "Column name is required" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "Project is required" }, { status: 400 });
  }

  let position = body.position;

  if (position === undefined) {
    const existing = await db
      .select()
      .from(columns)
      .where(eq(columns.project_id, projectId));
    position = existing.length;
  }

  const inserted = await db
    .insert(columns)
    .values({
      name,
      project_id: projectId,
      position,
    })
    .returning();

  return Response.json({ success: true, column: inserted[0] });
};

export const DELETE: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const id = url.searchParams.get("id");

  if (!id) return Response.json({ error: "ID is required" }, { status: 400 });

  const colId = Number(id);

  if (!Number.isInteger(colId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Delete associated tasks first
  await db.delete(dos).where(eq(dos.column_id, colId));
  await db.delete(columns).where(eq(columns.id, colId));

  return Response.json({ success: true });
};
