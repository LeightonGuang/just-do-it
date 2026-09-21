import type { SubCommand } from "../types";

export const createColumn: SubCommand = {
  name: "column",
  description: "Create a new column",

  parts: [
    {
      type: "keyword",
      value: "in",
    },
    {
      type: "argument",
      name: "project",
      placeholder: "Project name",
      valueType: "entity",
      entityType: "project",
      required: true,
    },
    {
      type: "argument",
      name: "name",
      placeholder: "Column name",
      valueType: "text",
      required: true,
      greedy: true,
    },
  ],

  execute: async ({ args, entities, refetch }) => {
    let projectId: number | undefined = entities.project?.id;

    if (!projectId && args.project) {
      const res = await fetch(`/api/projects?name=${encodeURIComponent(args.project.trim())}`);
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

    const res = await fetch("/api/columns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        project_id: projectId,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to create column");
    }

    await refetch.projects();
  },
};
