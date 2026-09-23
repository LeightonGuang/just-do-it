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
    {
      type: "keyword",
      value: "description",
      optional: true,
    },
    {
      type: "argument",
      name: "description",
      placeholder: "Description",
      valueType: "text",
      required: false,
      greedy: true,
    },
    {
      type: "keyword",
      value: "start",
      optional: true,
    },
    {
      type: "argument",
      name: "start_at",
      placeholder: "Start [dd-mm-yyyy hh:mm]",
      valueType: "text",
      required: false,
    },
    {
      type: "keyword",
      value: "end",
      optional: true,
    },
    {
      type: "argument",
      name: "end_at",
      placeholder: "End [dd-mm-yyyy hh:mm]",
      valueType: "text",
      required: false,
    },
  ],

  execute: async ({ args, entities, projectId: currentProjectId, refetch }) => {
    let projectId: number | undefined = entities.project?.id;

    if (!projectId && args.project) {
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

    const res = await fetch("/api/dos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: args.title,
        description: args.description?.trim() || null,
        project_id: projectId,
        start_at: args.start_at?.trim() || null,
        end_at: args.end_at?.trim() || null,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
      };
      throw new Error(data.error ?? "Failed to create do");
    }

    await refetch.dos();

    if (currentProjectId && String(projectId) === String(currentProjectId)) {
      await refetch.kanban?.();
    }
  },
};
