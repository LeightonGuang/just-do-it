import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { eq, ilike } from "drizzle-orm";

import { projects } from "../../db/schema";

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
    const filteredProjects = await db
      .select()
      .from(projects)
      .where(ilike(projects.name, `%${name}%`));

    return Response.json(filteredProjects);
  }

  if (limit) {
    return Response.json(await db.select().from(projects).limit(Number(limit)));
  }

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

export const DELETE: APIRoute = async ({ url }) => {
  const db = drizzle(env.just_do_it);

  const id = url.searchParams.get("id");

  if (!id) return Response.json({ error: "ID is required" }, { status: 400 });

  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  await db.delete(projects).where(eq(projects.id, projectId));

  return Response.json({ success: true });
};
