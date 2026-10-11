import { eq, desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { APIRoute } from "astro";

import { parseDate } from "../../../lib/date";
import { dos, doTags, tags, projects, columns } from "../../../db/schema";

export const GET: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const sidebarMode = new URL(request.url).searchParams.get("sidebar") === "true";

  if (sidebarMode) {
    // Sidebar mode - return up to 5 tasks with their tags
    const result = await db.select({
      id: dos.id,
      title: dos.title,
      project_id: dos.project_id,
      column_id: dos.column_id,
      description: dos.description,
      project_name: projects.name,
      project_colour: projects.colour,
    })
    .from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .orderBy(desc(dos.updated_at))
    .limit(5);

    // Fetch tags for each DO
    const dosWithTags = await Promise.all(
      result.map(async (task) => {
        const taskTags = await db.select({
          id: doTags.tag_id,
          name: tags.name,
        }).from(doTags)
          .innerJoin(tags, eq(doTags.tag_id, tags.id))
          .where(eq(doTags.do_id, task.id));
        return {
          ...task,
          tags: taskTags,
        };
      })
    );

    return Response.json(dosWithTags);
  }

  return Response.json(
    { error: "Use /api/dos/[doId] for a single task or pass ?sidebar=true" },
    { status: 400 },
  );
};

export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);
  const body = (await request.json()) as {
    title: string;
    project_id?: number;
    column_id?: number;
    description?: string | null;
    tags?: Array<{ id: number }>;
    start_at?: string | null;
    end_at?: string | null;
  };

  if (!body.title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const projectIdFromContext = body.project_id;
  const columnIdFromContext = body.column_id;

  const title = body.title.trim();
  const description = body.description ?? null;
  const startAt = typeof body.start_at === "string" && body.start_at.trim() ? parseDate(body.start_at) : null;
  const endAt = typeof body.end_at === "string" && body.end_at.trim() ? parseDate(body.end_at) : null;

  // If no project_id or column_id provided, we need to determine them from context
  if (!projectIdFromContext || !columnIdFromContext) {
    return Response.json({
      error: "project_id and column_id must be provided when creating tasks via API"
    }, { status: 400 });
  }

  const projectId = Number(projectIdFromContext);
  const columnId = Number(columnIdFromContext);

  // Handle column assignment if not provided
  let insertedColumnId: number | undefined = columnId;
  if (!columnId) {
    const existingCols = await db.select().from(columns).where(eq(columns.project_id, projectId));
    if (existingCols.length > 0) {
      insertedColumnId = existingCols[0].id;
    } else {
      const insertedCol = await db.insert(columns).values({ project_id: projectId, name: "To Do", position: 0 }).returning();
      insertedColumnId = insertedCol[0]?.id;
    }
  }

  if (!insertedColumnId) {
    return Response.json(
      { error: "Could not assign column to task" },
      { status: 500 },
    );
  }

  // Insert the task
  const insertData = {
    title,
    description,
    project_id: projectId,
    column_id: insertedColumnId,
    start_at: startAt !== null ? new Date(startAt) : null,
    end_at: endAt !== null ? new Date(endAt) : null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const insertResult = await db.insert(dos).values(insertData).returning();
  const newDo = insertResult[0];

  if (newDo && body.tags && body.tags.length > 0) {
    for (const tag of body.tags) {
      await db.insert(doTags).values({ do_id: newDo.id, tag_id: tag.id });
    }
  }

  // Fetch tags for the newly created DO
  const tagRows = newDo
    ? await db.select({
        id: doTags.tag_id,
        name: tags.name,
      }).from(doTags)
        .innerJoin(tags, eq(doTags.tag_id, tags.id))
        .where(eq(doTags.do_id, newDo.id))
    : [];

  return Response.json({
    success: true,
    task: {
      ...newDo,
      tags: tagRows,
    },
  });
};

export const MOVE: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);
  const body = (await request.json()) as { id: number; column_id: number };

  if (!body.id || !body.column_id) {
    return Response.json({ error: "id and column_id are required" }, { status: 400 });
  }

  const doId = body.id;
  const columnId = body.column_id;

  // Check if task exists
  const existing = await db.select({ id: dos.id }).from(dos).where(eq(dos.id, doId)).limit(1);
  if (existing.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Update the task's column_id
  await db.update(dos).set({
    column_id: columnId,
    updated_at: new Date(),
  }).where(eq(dos.id, doId));

  return Response.json({ success: true });
};
