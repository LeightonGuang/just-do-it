import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { eq } from "drizzle-orm";

import { projects } from "../../db/schema";

export const GET: APIRoute = async () => {
  const db = drizzle(env.just_do_it);

  const allProjects = await db.select().from(projects);

  return Response.json(allProjects);
};

export const POST: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    name?: string;
    colour?: string;
  };

  const name = body.name?.trim();
  const colour = body.colour;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  if (!colour) {
    return Response.json({ error: "Colour is required" }, { status: 400 });
  }

  await db.insert(projects).values({
    name,
    colour,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return Response.json({ success: true });
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = drizzle(env.just_do_it);

  const body = (await request.json()) as {
    id?: string;
  };

  const id = body.id;

  if (!id) return Response.json({ error: "ID is required" }, { status: 400 });

  await db.delete(projects).where(eq(projects.id, Number(id)));

  return Response.json({ success: true });
};
