import { eq, and, desc } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { APIRoute } from "astro";

import { parseDate } from "../../../../lib/date";
import { dos, projects, columns } from "../../../db/schema";

const VALID_PRIORITIES = ["low", "mid", "high"] as const;

function validatePriority(priority?: string | null) {
  if (priority === undefined || priority === null) {
    return null;
  }
  const p = priority.trim();
  if (VALID_PRIORITIES.includes(p as any)) {
    return p as "low" | "mid" | "high";
  }
  return null;
}

const db = drizzle(env.just_do_it);

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as {
    title: string;
    project_id?: number;
    column_id?: number;
    description?: string | null;
    priority?: "low" | "mid" | "high" | null;
    start_at?: string | null;
    end_at?: string | null;
  };

  if (!body.title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  // Get project and column from context if not provided in request
  let projectIdFromContext = body.project_id;
  let columnIdFromContext = body.column_id;

  const title = body.title.trim();
  const description = body.description ?? null;
  const priority = validatePriority(body.priority);
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

  // Insert using drizzle - values must match $inferInsert type exactly
  await db.insert(dos).values({
    title,
    project_id: projectId,
    column_id: insertedColumnId,
    description,
    priority,
    start_at: startAt,
    end_at: endAt,
    created_at: new Date(Date.now()),
    updated_at: new Date(Date.now()),
  }).run();

  // Query the newly inserted row - get the most recently created item in this column/project
  const result = await db
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
    .where(and(eq(dos.project_id, projectId), eq(dos.column_id, insertedColumnId)))
    .orderBy(desc(dos.updated_at))
    .limit(1);

  return Response.json({
    success: true,
    task: result[0],
  });
};

export const GET: APIRoute = async ({ params }) => {
  const doIdStr = params.id;
  
  if (!doIdStr) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const doId = parseInt(doIdStr, 10);

  if (isNaN(doId)) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const result = await db
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
    .where(eq(dos.id, doId));

  if (result.length === 0) {
    return Response.json({ error: "DO not found" }, { status: 404 });
  }

  return Response.json({ task: result[0] });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const doIdStr = params.id;
  
  if (!doIdStr) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const doId = parseInt(doIdStr, 10);

  if (isNaN(doId)) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const body = (await request.json()) as {
    title?: string;
    project_id?: number;
    column_id?: number;
    description?: string | null;
    priority?: "low" | "mid" | "high" | null;
    start_at?: string | null;
    end_at?: string | null;
  };

  if (!body.title) {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  // Get project and column from context if not provided in request
  let projectIdFromContext = body.project_id;
  let columnIdFromContext = body.column_id;

  const title = body.title.trim();
  const description = body.description ?? null;
  const priority = validatePriority(body.priority);
  const startAt = typeof body.start_at === "string" && body.start_at.trim() ? parseDate(body.start_at) : null;
  const endAt = typeof body.end_at === "string" && body.end_at.trim() ? parseDate(body.end_at) : null;

  // If no project_id or column_id provided, we need to determine them from context
  if (!projectIdFromContext || !columnIdFromContext) {
    return Response.json({ 
      error: "project_id and column_id must be provided when updating tasks via API" 
    }, { status: 400 });
  }

  const projectId = Number(projectIdFromContext);
  const columnId = Number(columnIdFromContext);

  // Handle column assignment if not provided (only allow if explicitly provided or same as original)
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

  // Check if we're moving to a different column
  const currentDo = await db.select({ column_id: dos.column_id }).from(dos).where(eq(dos.id, doId));
  const movingColumn = insertedColumnId !== currentDo[0]?.column_id;

  // Update the task using drizzle v5 syntax (no .values() for update)
  await db.update(dos).set({
    title,
    project_id: projectId,
    column_id: insertedColumnId,
    description,
    priority,
    start_at: startAt,
    end_at: endAt,
    updated_at: new Date(Date.now()),
  }).where(eq(dos.id, doId)).run();
  const result = await db
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
    .where(eq(dos.id, doId));

  return Response.json({ task: result[0] });
};

export const DELETE: APIRoute = async ({ params }) => {
  const doIdStr = params.id;
  
  if (!doIdStr) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const doId = parseInt(doIdStr, 10);

  if (isNaN(doId)) {
    return Response.json({ error: "Invalid DO ID" }, { status: 400 });
  }

  const result = await db.delete(dos).where(eq(dos.id, doId));

  if (result.results.length === 0) {
    return Response.json({ error: "DO not found" }, { status: 404 });
  }

  return Response.json({ success: true });
};