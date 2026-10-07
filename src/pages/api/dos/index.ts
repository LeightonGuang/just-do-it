import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, and, asc, isNull, inArray } from "drizzle-orm";

import { parseDate } from "../../../../lib/date";
import { dos, columns, projects, doTags, tags } from "../../../db/schema";

export const GET: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const title = url.searchParams.get("title");
  const projectIdParam = url.searchParams.get("project_id");
  const isSidebar = url.searchParams.get("sidebar") === "true";

  const conditions = [];

  if (title?.trim()) conditions.push(like(dos.title, `%${title.trim()}%`));

  if (projectIdParam) {
    const projectId = Number(projectIdParam);

    if (!Number.isNaN(projectId))
      conditions.push(eq(dos.project_id, projectId));
  }

  // Sidebar only shows unfinished tasks.
  if (isSidebar) conditions.push(eq(columns.is_done, false));

  const tasks = await db
    .select({
      id: dos.id,
      title: dos.title,
      description: dos.description,
      priority: dos.priority,

      project_id: dos.project_id,
      project_name: projects.name,
      project_colour: projects.colour,

      column_id: dos.column_id,

      start_at: dos.start_at,
      end_at: dos.end_at,

      created_at: dos.created_at,
      updated_at: dos.updated_at,
    })
    .from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .innerJoin(columns, eq(dos.column_id, columns.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(isNull(dos.end_at)), asc(dos.end_at))
    .limit(isSidebar ? 5 : 1000);

  if (tasks.length === 0) {
    return Response.json([]);
  }

  // Fetch tags for the returned todos.
  const doIds = tasks.map((task) => task.id);

  const taskTags = await db
    .select({
      do_id: doTags.do_id,
      id: tags.id,
      name: tags.name,
      colour: tags.colour,
    })
    .from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id))
    .where(inArray(doTags.do_id, doIds));

  const tagsByDo = new Map<
    number,
    {
      id: number;
      name: string;
      colour: string;
    }[]
  >();

  for (const tag of taskTags) {
    const existing = tagsByDo.get(tag.do_id) ?? [];

    existing.push({
      id: tag.id,
      name: tag.name,
      colour: tag.colour,
    });

    tagsByDo.set(tag.do_id, existing);
  }

  const result = tasks.map((task) => ({
    ...task,
    tags: tagsByDo.get(task.id) ?? [],
  }));

  return Response.json(result);
};

// POST /api/dos - create a do
export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    title?: string;
    project_id?: number;
    column_id?: number;
    description?: string;
    start_at?: string | null;
    end_at?: string | null;
  };

  const title = body.title?.trim();
  const projectId = body.project_id;
  const description = body.description?.trim() || null;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  if (!projectId) {
    return Response.json({ error: "Project is required" }, { status: 400 });
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
      { error: "Start time must be before end time" },
      { status: 400 },
    );
  }

  let columnId = body.column_id;

  if (!columnId) {
    const existingCols = await db
      .select()
      .from(columns)
      .where(eq(columns.project_id, projectId));

    if (existingCols.length > 0) {
      columnId = existingCols[0].id;
    } else {
      const insertedCol = await db
        .insert(columns)
        .values({
          project_id: projectId,
          name: "To Do",
          position: 0,
        })
        .returning();

      columnId = insertedCol[0]?.id;
    }
  }

  if (!columnId) {
    return Response.json(
      { error: "Could not assign column to task" },
      { status: 500 },
    );
  }

  const now = new Date();

  const inserted = await db
    .insert(dos)
    .values({
      title,
      description,
      project_id: projectId,
      column_id: columnId,
      start_at: startAt,
      end_at: endAt,
      created_at: now,
      updated_at: now,
    })
    .returning();

  return Response.json({
    success: true,
    task: inserted[0],
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    id?: number;
    title?: string;
    description?: string | null;
    column_id?: number;
    project_id?: number;
    tag_id?: number | null;
    start_at?: string | null;
    end_at?: string | null;
  };

  if (!body.id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
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

  // Make sure the task exists.
  const existingDo = await db
    .select({
      id: dos.id,
      project_id: dos.project_id,
    })
    .from(dos)
    .where(eq(dos.id, body.id))
    .limit(1);

  if (existingDo.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (body.title !== undefined) {
    const title = body.title.trim();

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 });
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

  if (body.start_at !== undefined) {
    updateData.start_at = startAt;
  }

  if (body.end_at !== undefined) {
    updateData.end_at = endAt;
  }

  // Update the task itself.
  await db.update(dos).set(updateData).where(eq(dos.id, body.id));

  // Update tag relationship if tag_id was included in the request.
  if (body.tag_id !== undefined) {
    // Remove existing tag relationships.
    await db.delete(doTags).where(eq(doTags.do_id, body.id));

    // Add the new tag relationship.
    if (body.tag_id !== null) {
      const tagId = Number(body.tag_id);

      if (!Number.isInteger(tagId)) {
        return Response.json({ error: "Invalid tag ID" }, { status: 400 });
      }

      // Make sure the tag actually exists.
      const existingTag = await db
        .select({
          id: tags.id,
        })
        .from(tags)
        .where(eq(tags.id, tagId))
        .limit(1);

      if (existingTag.length === 0) {
        return Response.json({ error: "Tag not found" }, { status: 404 });
      }

      await db.insert(doTags).values({
        do_id: body.id,
        tag_id: tagId,
      });
    }
  }

  return Response.json({
    success: true,
  });
};
