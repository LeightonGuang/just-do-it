import { and, eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { doOccurrences } from "../../../../db/schema";

export const GET: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);
  const doId = Number(params.doId);
  const rows = await db
    .select()
    .from(doOccurrences)
    .where(eq(doOccurrences.do_id, doId))
    .all();
  return Response.json({ occurrences: rows });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const db = drizzle(env.just_do_it);
  const doId = Number(params.doId);
  const body = (await request.json()) as {
    occurrence_id?: number;
    status?: "pending" | "completed" | "skipped" | "missed";
  };
  if (!body.occurrence_id || !body.status)
    return Response.json(
      { error: "occurrence_id and status are required" },
      { status: 400 },
    );
  const updated = await db
    .update(doOccurrences)
    .set({
      status: body.status,
      completed_at: body.status === "completed" ? new Date() : null,
    })
    .where(
      and(
        eq(doOccurrences.id, body.occurrence_id),
        eq(doOccurrences.do_id, doId),
      ),
    )
    .returning();
  if (!updated.length)
    return Response.json({ error: "Occurrence not found" }, { status: 404 });
  return Response.json({ occurrence: updated[0] });
};
