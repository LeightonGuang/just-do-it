import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { dos } from "../../../../db/schema";

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const id = Number(params.doId);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const existing = await db
    .select({ id: dos.id })
    .from(dos)
    .where(eq(dos.id, id))
    .limit(1);

  if (existing.length === 0) {
    return Response.json({ error: "Do not found" }, { status: 404 });
  }

  await db.delete(dos).where(eq(dos.id, id));

  return Response.json({ success: true });
};
