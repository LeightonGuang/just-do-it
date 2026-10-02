import type { APIRoute } from "astro";
import { eq, like } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import { columns, projects } from "../../../db/schema";

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
      .where(like(projects.name, `%${name}%`));

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
  const colour = body.colour ?? "#000000";

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await db.batch([
    db
      .insert(projects)
      .values({
        name,
        colour,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: projects.id }),
  ]);

  const projectId = result[0][0].id;

  // create default columns for the project
  await db.insert(columns).values([
    {
      project_id: projectId,
      name: "Dos",
      position: 0,
      is_done: false,
    },
    {
      project_id: projectId,
      name: "Done",
      position: 1,
      is_done: true,
    },
  ]);

  return Response.json({ success: true });
};
