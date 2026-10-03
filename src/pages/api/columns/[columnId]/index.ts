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
    isDone?: boolean;
  };

  const existing = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .get();

  if (!existing) {
    return Response.json({ error: "Column not found" }, { status: 404 });
  }

  const updates: {
    name?: string;
    position?: number;
    is_done?: boolean;
  } = {};

  // Update name
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

  // Update position
  if (body.position !== undefined) {
    if (!Number.isInteger(body.position)) {
      return Response.json(
        { error: "Position must be an integer" },
        { status: 400 },
      );
    }

    updates.position = body.position;
  }

  // Validate isDone
  if (body.isDone !== undefined) {
    if (typeof body.isDone !== "boolean") {
      return Response.json(
        { error: "isDone must be a boolean" },
        { status: 400 },
      );
    }

    updates.is_done = body.isDone;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  /*
   * If this column is being marked as the done column,
   * first unset the existing done column for this project.
   *
   * This is done using a D1 batch so both operations are
   * submitted together.
   */
  if (body.isDone === true && !existing.is_done) {
    try {
      const updated = await db.batch([
        db
          .update(columns)
          .set({ is_done: false })
          .where(eq(columns.project_id, existing.project_id)),

        db
          .update(columns)
          .set(updates)
          .where(eq(columns.id, columnId))
          .returning(),
      ]);

      const updatedColumn = updated[1]?.[0];

      return Response.json({
        success: true,
        column: updatedColumn,
      });
    } catch (error) {
      console.error("Failed to update done column:", error);

      return Response.json(
        { error: "Failed to update column" },
        { status: 500 },
      );
    }
  }

  // Normal update, including setting isDone back to false.
  try {
    const updated = await db
      .update(columns)
      .set(updates)
      .where(eq(columns.id, columnId))
      .returning();

    return Response.json({
      success: true,
      column: updated[0],
    });
  } catch (error) {
    console.error("Failed to update column:", error);

    return Response.json({ error: "Failed to update column" }, { status: 500 });
  }
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
