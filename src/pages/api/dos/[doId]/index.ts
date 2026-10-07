import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { APIRoute } from "astro";

import { parseDate } from "../../../../../lib/date";
import { dos, doTags, tags } from "../../../../db/schema";

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);

  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json(
      { error: "Invalid task ID" },
      { status: 400 },
    );
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string | null;
    column_id?: number;
    project_id?: number;
    start_at?: string | null;
    end_at?: string | null;
    tag_id?: number | null;
  };

  // Make sure the task exists.
  const existing = await db
    .select({
      id: dos.id,
      project_id: dos.project_id,
    })
    .from(dos)
    .where(eq(dos.id, doId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  const startAt =
    typeof body.start_at === "string" && body.start_at.trim()
      ? parseDate(body.start_at)
      : null;

  const endAt =
    typeof body.end_at === "string" && body.end_at.trim()
      ? parseDate(body.end_at)
      : null;

  if (body.start_at && !startAt) {
    return Response.json(
      {
        error:
          "Invalid start date. Use d-m-yyyy or d-m-yyyy hh:mm (24-hour time).",
      },
      { status: 400 },
    );
  }

  if (body.end_at && !endAt) {
    return Response.json(
      {
        error:
          "Invalid end date. Use d-m-yyyy or d-m-yyyy hh:mm (24-hour time).",
      },
      { status: 400 },
    );
  }

  if (startAt && endAt && startAt > endAt) {
    return Response.json(
      {
        error: "Start time must be before end time",
      },
      { status: 400 },
    );
  }

  // Validate tag before modifying anything.
  if (body.tag_id !== undefined && body.tag_id !== null) {
    const tag = await db
      .select({
        id: tags.id,
      })
      .from(tags)
      .where(eq(tags.id, body.tag_id))
      .limit(1);

    if (tag.length === 0) {
      return Response.json(
        { error: "Tag not found" },
        { status: 400 },
      );
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (body.title !== undefined) {
    const title = body.title.trim();

    if (!title) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 },
      );
    }

    updateData.title = title;
  }

  if (body.description !== undefined) {
    updateData.description =
      body.description?.trim() || null;
  }

  if (body.column_id !== undefined) {
    updateData.column_id = body.column_id;
  }

  if (body.project_id !== undefined) {
    updateData.project_id = body.project_id;
  }

  if (body.start_at !== undefined) {
    updateData.start_at = startAt;
  }

  if (body.end_at !== undefined) {
    updateData.end_at = endAt;
  }

  // Update the task.
  await db
    .update(dos)
    .set(updateData)
    .where(eq(dos.id, doId));

  // Update tags only when tag_id was actually supplied.
  if (body.tag_id !== undefined) {
    // Remove existing tag assignments.
    await db
      .delete(doTags)
      .where(eq(doTags.do_id, doId));

    // Add new tag assignment.
    if (body.tag_id !== null) {
      await db.insert(doTags).values({
        do_id: doId,
        tag_id: body.tag_id,
      });
    }
  }

  return Response.json({
    success: true,
    id: doId,
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json(
      { error: "Invalid task ID" },
      { status: 400 },
    );
  }

  const existing = await db
    .select({
      id: dos.id,
    })
    .from(dos)
    .where(eq(dos.id, doId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  await db
    .delete(dos)
    .where(eq(dos.id, doId));

  return Response.json({
    success: true,
  });
};
