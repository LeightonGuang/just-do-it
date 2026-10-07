import { like } from "drizzle-orm";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { tags } from "../../../db/schema";

export const GET: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const name = url.searchParams.get("name");
  const limit = url.searchParams.get("limit");

  if (name && limit) {
    return Response.json(
      { error: "Cannot use 'name' and 'limit' together." },
      { status: 400 },
    );
  }

  if (name) {
    const filteredTags = await db
      .select()
      .from(tags)
      .where(like(tags.name, `%${name}%`));

    return Response.json(filteredTags);
  }

  if (limit)
    return Response.json(await db.select().from(tags).limit(Number(limit)));

  return Response.json(await db.select().from(tags));
};

export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    name?: string;
    colour?: string;
  };

  const name = body.name?.trim();
  const colour = body.colour ?? "#000000";

  if (!name)
    return Response.json({ error: "Name is required" }, { status: 400 });

  try {
    const [tag] = await db
      .insert(tags)
      .values({
        name,
        colour,
        created_at: new Date(),
      })
      .returning();

    return Response.json({
      success: true,
      tag,
    });
  } catch {
    return Response.json(
      { error: "A tag with this name already exists." },
      { status: 409 },
    );
  }
};
