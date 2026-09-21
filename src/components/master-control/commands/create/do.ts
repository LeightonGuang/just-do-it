import type { SubCommand } from "../types";

export const createDo: SubCommand = {
  name: "do",
  description: "Create a new do",

  parts: [
    {
      type: "argument",
      name: "title",
      placeholder: "Do title",
      valueType: "text",
      required: true,
      greedy: true,
    },
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
  ],

  execute: async ({ args, entities, refetch }) => {
    let projectId: number | undefined = entities.project?.id;

    if (!projectId && args.project) {
      // Find project by name if entity was typed instead of selected
      const res = await fetch(
        `/api/projects?name=${encodeURIComponent(args.project.trim())}`,
      );
      if (res.ok) {
        const found = await res.json();
        if (Array.isArray(found) && found.length > 0) {
          projectId = found[0].id;
        }
      }
    }

    if (!projectId) {
      // Fallback to default (first) project if no project specified or found
      const res = await fetch("/api/projects");
      if (res.ok) {
        const projects = await res.json();
        if (Array.isArray(projects) && projects.length > 0) {
          projectId = projects[0].id;
        }
      }
    }

    if (!projectId) {
      throw new Error("No project found. Please create a project first.");
    }

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: args.title,
        project_id: projectId,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to create do");
    }

    await refetch.dos();
  },
};
