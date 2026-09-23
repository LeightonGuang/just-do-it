import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq, like, and, asc } from "drizzle-orm";

import { parseDate } from "../../../../lib/date";
import { dos, columns, projects } from "../../../db/schema";

export const GET: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const title = url.searchParams.get("title");
  const projectIdParam = url.searchParams.get("project_id");
  const isSidebar = url.searchParams.get("sidebar") === "true";

  if (isSidebar) {
    const sidebarDos = await db
      .select({
        id: dos.id,
        title: dos.title,
        description: dos.description,
        start_at: dos.start_at,
        end_at: dos.end_at,
        created_at: dos.created_at,
        updated_at: dos.updated_at,
        project_id: dos.project_id,
        column_id: dos.column_id,
        project_colour: projects.colour,
      })
      .from(dos)
      .innerJoin(projects, eq(dos.project_id, projects.id))
      .orderBy(asc(dos.end_at))
      .limit(5);

    return Response.json(sidebarDos);
  }

  const conditions = [];

  if (title?.trim()) conditions.push(like(dos.title, `%${title.trim()}%`));

  if (projectIdParam) {
    const projectId = Number(projectIdParam);

    if (!Number.isNaN(projectId))
      conditions.push(eq(dos.project_id, projectId));
  }

  if (conditions.length > 0) {
    const tasks = await db
      .select()
      .from(dos)
      .where(and(...conditions));

    return Response.json(tasks);
  }

  const allTasks = await db.select().from(dos);

  return Response.json(allTasks);
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
  };

  if (!body.id) {
    return Response.json({ error: "ID is required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (body.title !== undefined) {
    updateData.title = body.title.trim();
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

  await db.update(dos).set(updateData).where(eq(dos.id, body.id));

  return Response.json({ success: true });
};
