import type { SubCommand } from "../types";

export const editProject: SubCommand = {
  name: "project",
  description: "Update a project",

  parts: [
    {
      type: "argument",
      name: "project",
      placeholder: "Project name",
      valueType: "entity",
      entityType: "project",
      required: true,
    },

    {
      type: "keyword",
      value: "name",
      optional: true,
    },
    {
      type: "argument",
      name: "name",
      placeholder: "New name",
      valueType: "text",
      required: false,
      greedy: true,
    },

    {
      type: "keyword",
      value: "colour",
      optional: true,
    },
    {
      type: "argument",
      name: "colour",
      placeholder: "New colour",
      valueType: "colour",
      required: false,
      greedy: false,
    },
  ],

  execute: async ({ args, entities, refetch }) => {
    let projectId: number | undefined = entities.project?.id;

    if (!projectId && args.project) {
      const res = await fetch(
        `/api/projects?title=${encodeURIComponent(args.project.trim())}`,
      );

      if (res.ok) {
        const found = await res.json();

        if (Array.isArray(found) && found.length > 0) {
          projectId = found[0].id;
        }
      }
    }

    if (!projectId) {
      throw new Error(`Project "${args.project || ""}" not found`);
    }

    const name = typeof args.name === "string" ? args.name.trim() : undefined;

    const colour = typeof args.colour === "string" ? args.colour : undefined;

    if (!name && !colour) {
      throw new Error("Nothing to update");
    }

    // TODO: Check if colour is valid

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...(name ? { name } : {}),
        ...(colour ? { colour } : {}),
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
      };

      throw new Error(data.error ?? "Failed to update project");
    }

    await refetch.projects();
  },
};
