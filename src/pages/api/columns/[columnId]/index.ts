import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, dos } from "../../../../db/schema";

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);

  const columnId = Number(params.columnId);

  if (!Number.isInteger(columnId)) {
    return Response.json({ error: "Invalid column ID" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    position?: number;
  };

  const updates: {
    name?: string;
    position?: number;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();

    if (!name) {
      return Response.json(
        { error: "Column name is required" },
        { status: 400 },
      );
    }

    updates.name = name;
  }

  if (body.position !== undefined) {
    if (!Number.isInteger(body.position)) {
      return Response.json(
        { error: "Position must be an integer" },
        { status: 400 },
      );
    }

    updates.position = body.position;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .get();

  if (!existing) {
    return Response.json({ error: "Column not found" }, { status: 404 });
  }

  const updated = await db
    .update(columns)
    .set(updates)
    .where(eq(columns.id, columnId))
    .returning();

  return Response.json({
    success: true,
    column: updated[0],
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const columnId = Number(params.columnId);

  if (!Number.isInteger(columnId)) {
    return Response.json({ error: "Invalid column ID" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .get();

  if (!existing) {
    return Response.json({ error: "Column not found" }, { status: 404 });
  }

  // Delete cards belonging to the column first.
  await db.delete(dos).where(eq(dos.column_id, columnId));

  // Then delete the column.
  await db.delete(columns).where(eq(columns.id, columnId));

  return Response.json({
    success: true,
  });
};
