import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import type { APIRoute } from "astro";

import { parseDate } from "../../../../lib/date";
import { dos, doTags, tags, projects } from "../../../../db/schema";
import { doRecurrences, doOccurrences } from "../../../../db/schema";

const recurrenceShape = (
  value:
    | {
        weekdays: string;
        start_date: string;
        end_date: string | null;
        interval_weeks: number;
        is_active: boolean;
      }
    | undefined,
) =>
  value ? { ...value, weekdays: JSON.parse(value.weekdays) as number[] } : null;

const generateOccurrences = async (
  db: ReturnType<typeof drizzle>,
  taskId: number,
  recurrenceId: number,
  rule: {
    weekdays: string;
    start_date: string;
    end_date: string | null;
    interval_weeks: number;
  },
) => {
  const weekdays = JSON.parse(rule.weekdays) as number[];
  const start = new Date(`${rule.start_date}T00:00:00Z`);
  const horizon = new Date();
  horizon.setUTCDate(horizon.getUTCDate() + 90);
  const end = rule.end_date ? new Date(`${rule.end_date}T00:00:00Z`) : horizon;
  const dates: string[] = [];
  for (
    let cursor = new Date(start);
    cursor <= end && cursor <= horizon;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const weeks = Math.floor(
      (cursor.getTime() - start.getTime()) / (7 * 86400000),
    );
    const weekday = cursor.getUTCDay() === 0 ? 7 : cursor.getUTCDay();
    if (weeks % rule.interval_weeks === 0 && weekdays.includes(weekday))
      dates.push(cursor.toISOString().slice(0, 10));
  }
  for (const occurrence_date of dates)
    await db
      .insert(doOccurrences)
      .values({
        do_id: taskId,
        recurrence_id: recurrenceId,
        occurrence_date,
        created_at: new Date(),
      })
      .onConflictDoNothing();
};

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);
  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  // Fetch the DO with tags
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
      project_colour: projects.colour,
    })
    .from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .where(eq(dos.id, doId))
    .limit(1);

  if (result.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Fetch tags for this DO
  const tagRows = await db
    .select({
      id: doTags.tag_id,
      name: tags.name,
      colour: tags.colour,
    })
    .from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id))
    .where(eq(doTags.do_id, result[0].id));

  const recurrenceRow = (
    await db
      .select()
      .from(doRecurrences)
      .where(eq(doRecurrences.do_id, doId))
      .limit(1)
  )[0];
  if (recurrenceRow?.is_active)
    await generateOccurrences(db, doId, recurrenceRow.id, recurrenceRow);

  return Response.json({
    task: {
      ...result[0],
      tags: tagRows,
      recurrence: recurrenceShape(recurrenceRow),
    },
  });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);

  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
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
    recurrence?: {
      weekdays: number[];
      start_date: string;
      end_date?: string | null;
      interval_weeks: number;
      is_active: boolean;
    } | null;
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
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Calculate start/end times for the update
  let startAt: number | null | undefined;
  let endAt: number | null | undefined;

  if (body.start_at !== undefined) {
    const parsedStart = parseDate(body.start_at ?? "");
    startAt = parsedStart;
  }

  if (body.end_at !== undefined) {
    const parsedEnd = parseDate(body.end_at ?? "");
    endAt = parsedEnd;
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

  if (startAt !== undefined) {
    updateData.start_at = startAt === null ? null : new Date(startAt);
  }

  if (endAt !== undefined) {
    updateData.end_at = endAt === null ? null : new Date(endAt);
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

  if (body.recurrence !== undefined) {
    const r = body.recurrence;
    if (r === null)
      await db
        .update(doRecurrences)
        .set({ is_active: false, updated_at: new Date() })
        .where(eq(doRecurrences.do_id, doId));
    else {
      if (
        !r.start_date ||
        !r.weekdays.length ||
        !Number.isInteger(r.interval_weeks) ||
        r.interval_weeks < 1 ||
        r.weekdays.some((d) => d < 1 || d > 7)
      )
        return Response.json(
          { error: "Invalid recurrence rule" },
          { status: 400 },
        );
      const prior = (
        await db
          .select({ id: doRecurrences.id })
          .from(doRecurrences)
          .where(eq(doRecurrences.do_id, doId))
          .limit(1)
      )[0];
      if (prior)
        await db
          .update(doRecurrences)
          .set({
            weekdays: JSON.stringify(r.weekdays),
            start_date: r.start_date,
            end_date: r.end_date || null,
            interval_weeks: r.interval_weeks,
            is_active: r.is_active,
            updated_at: new Date(),
          })
          .where(eq(doRecurrences.id, prior.id));
      else {
        const inserted = await db
          .insert(doRecurrences)
          .values({
            do_id: doId,
            weekdays: JSON.stringify(r.weekdays),
            start_date: r.start_date,
            end_date: r.end_date || null,
            interval_weeks: r.interval_weeks,
            is_active: r.is_active,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning({ id: doRecurrences.id });
        if (inserted[0])
          await generateOccurrences(db, doId, inserted[0].id, {
            ...r,
            weekdays: JSON.stringify(r.weekdays),
            end_date: r.end_date || null,
          });
      }
    }
  }
  const activeRecurrence = (
    await db
      .select()
      .from(doRecurrences)
      .where(eq(doRecurrences.do_id, doId))
      .limit(1)
  )[0];
  if (activeRecurrence?.is_active)
    await generateOccurrences(db, doId, activeRecurrence.id, activeRecurrence);

  // Update the task.
  await db.update(dos).set(updateData).where(eq(dos.id, doId));

  // Update tags based on what's provided in the request.
  if (body.tags !== undefined) {
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
      project_colour: projects.colour,
    })
    .from(dos)
    .innerJoin(projects, eq(dos.project_id, projects.id))
    .where(eq(dos.id, doId))
    .limit(1);

  if (updatedTask.length === 0) {
    return Response.json(
      { error: "Failed to retrieve updated task" },
      { status: 500 },
    );
  }

  // Fetch tags for this DO
  const tagRows = await db
    .select({
      id: doTags.tag_id,
      name: tags.name,
      colour: tags.colour,
    })
    .from(doTags)
    .innerJoin(tags, eq(doTags.tag_id, tags.id))
    .where(eq(doTags.do_id, updatedTask[0].id));
  const recurrenceRow = (
    await db
      .select()
      .from(doRecurrences)
      .where(eq(doRecurrences.do_id, doId))
      .limit(1)
  )[0];

  return Response.json({
    success: true,
    task: {
      ...updatedTask[0],
      tags: tagRows,
      recurrence: recurrenceShape(recurrenceRow),
    },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const doId = Number(params.doId);

  if (!Number.isInteger(doId)) {
    return Response.json({ error: "Invalid task ID" }, { status: 400 });
  }

  const existing = await db
    .select({ id: dos.id })
    .from(dos)
    .where(eq(dos.id, doId))
    .limit(1);

  if (existing.length === 0) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Delete the task and its associated tags
  await db.delete(doTags).where(eq(doTags.do_id, doId));
  await db.delete(dos).where(eq(dos.id, doId));

  return Response.json({ success: true });
};
