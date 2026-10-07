import { eq } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { tags } from "../../../../db/schema";

export const DELETE: APIRoute = async ({ params }) => {
  const db = drizzle(env.just_do_it);

  const id = Number(params.tagId);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid tag ID" }, { status: 400 });
  }

  const result = await db
    .delete(tags)
    .where(eq(tags.id, id))
    .returning({ id: tags.id });

  if (result.length === 0) {
    return Response.json({ error: "Tag not found" }, { status: 404 });
  }

  return Response.json({ success: true });
};
