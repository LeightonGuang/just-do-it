import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { APIRoute } from "astro";

import { parseDate } from "../../../../lib/date";
import { dos, doTags, tags, projects } from "../../../../db/schema";

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);
  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json(
      { error: "Invalid task ID" },
      { status: 400 },
    );
  }

  // Fetch the DO with tags
  const result = await db.select({ 
    id: dos.id, 
    title: dos.title, 
    description: dos.description, 
    project_id: dos.project_id, 
    column_id: dos.column_id, 
    start_at: dos.start_at, 
    end_at: dos.end_at, 
    created_at: dos.created_at, 
    updated_at: dos.updated_at,
    project_name: projects.name,
    project_colour: projects.colour 
  }).from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .where(eq(dos.id, doId))
    .limit(1);

  if (result.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Fetch tags for this DO
  const tagRows = await db.select({
    id: doTags.tag_id,
    name: tags.name,
    colour: tags.colour,
  }).from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id))
    .where(eq(doTags.do_id, result[0].id));

  return Response.json({ task: { ...result[0], tags: tagRows } });
};

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
    position?: number;
    tags?: Array<{ id: number }>;
  };

  // Make sure the task exists.
  const existing = await db
    .select({
      id: dos.id,
      title: dos.title,
      description: dos.description,
      project_id: dos.project_id,
      column_id: dos.column_id,
      start_at: dos.start_at,
      end_at: dos.end_at,
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

  // Calculate start/end times for the update
  let startAt: number | null = null;
  let endAt: number | null = null;

  if (body.start_at !== undefined) {
    const parsedStart = parseDate(body.start_at ?? "");
    if (parsedStart) {
      startAt = parsedStart;
    }
  }

  if (body.end_at !== undefined) {
    const parsedEnd = parseDate(body.end_at ?? "");
    if (parsedEnd) {
      endAt = parsedEnd;
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
    updateData.description = body.description?.trim() || null;
  }

  if (body.column_id !== undefined) {
    updateData.column_id = body.column_id;
  }

  if (body.project_id !== undefined) {
    updateData.project_id = body.project_id;
  }

  if (startAt !== null) {
    updateData.start_at = new Date(startAt);
  }

  if (endAt !== null) {
    updateData.end_at = new Date(endAt);
  }

  if (body.position !== undefined) {
    if (!Number.isInteger(body.position)) {
      return Response.json(
        { error: "Position must be an integer" },
        { status: 400 },
      );
    }
    updateData.position = body.position;
  }

  // Update the task.
  await db.update(dos).set(updateData).where(eq(dos.id, doId));

  // Update tags based on what's provided in the request.
  if (body.tags && body.tags.length > 0) {
    // Remove existing tag assignments for this DO.
    await db.delete(doTags).where(eq(doTags.do_id, doId));

    // Add new tag assignments.
    for (const tagObj of body.tags) {
      await db.insert(doTags).values({
        do_id: doId,
        tag_id: tagObj.id,
      });
    }
  }

  // Re-fetch the updated DO with tags to return to frontend
  const updatedTask = await db
    .select({ 
      id: dos.id, 
      title: dos.title, 
      description: dos.description, 
      project_id: dos.project_id, 
      column_id: dos.column_id, 
      start_at: dos.start_at, 
      end_at: dos.end_at, 
      created_at: dos.created_at, 
      updated_at: dos.updated_at,
      project_name: projects.name,
      project_colour: projects.colour 
    })
    .from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .where(eq(dos.id, doId))
    .limit(1);

  if (updatedTask.length === 0) {
    return Response.json({ error: "Failed to retrieve updated task" }, { status: 500 });
  }

  // Fetch tags for this DO
  const tagRows = await db.select({
    id: doTags.tag_id,
    name: tags.name,
    colour: tags.colour,
  }).from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id))
    .where(eq(doTags.do_id, updatedTask[0].id));

  return Response.json({
    success: true,
    task: {
      ...updatedTask[0],
      tags: tagRows,
    },
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

  const existing = await db.select({ id: dos.id }).from(dos).where(eq(dos.id, doId)).limit(1);

  if (existing.length === 0) {
    return Response.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  // Delete the task and its associated tags
  await db.delete(doTags).where(eq(doTags.do_id, doId));
  await db.delete(dos).where(eq(dos.id, doId));

  return Response.json({ success: true });
};