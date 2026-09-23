import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, dos } from "../../../../db/schema";

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);

  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json({ error: "Invalid Do ID" }, { status: 400 });
  }

  const body = (await request.json()) as {
    columnId?: unknown;
  };

  const columnId = Number(body.columnId);

  if (!Number.isInteger(columnId)) {
    return Response.json({ error: "Invalid column ID" }, { status: 400 });
  }

  const existingDo = await db
    .select({
      id: dos.id,
      project_id: dos.project_id,
    })
    .from(dos)
    .where(eq(dos.id, doId))
    .limit(1);

  if (existingDo.length === 0) {
    return Response.json({ error: "Do not found" }, { status: 404 });
  }

  const targetColumn = await db
    .select({
      id: columns.id,
      project_id: columns.project_id,
    })
    .from(columns)
    .where(eq(columns.id, columnId))
    .limit(1);

  if (targetColumn.length === 0) {
    return Response.json({ error: "Column not found" }, { status: 404 });
  }

  if (targetColumn[0].project_id !== existingDo[0].project_id) {
    return Response.json(
      { error: "Column does not belong to this project" },
      { status: 400 },
    );
  }

  const updated = await db
    .update(dos)
    .set({
      column_id: columnId,
      updated_at: new Date(),
    })
    .where(eq(dos.id, doId))
    .returning();

  return Response.json(updated[0]);
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const id = Number(params.doId);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await db
    .select({ id: dos.id })
    .from(dos)
    .where(eq(dos.id, id))
    .limit(1);

  if (existing.length === 0) {
    return Response.json({ error: "Do not found" }, { status: 404 });
  }

  await db.delete(dos).where(eq(dos.id, id));

  return Response.json({ success: true });
};
