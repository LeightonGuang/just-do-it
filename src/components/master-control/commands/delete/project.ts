import type { SubCommand } from "../types";

export const deleteProject: SubCommand = {
  name: "project",
  description: "Delete a project",

  parts: [
    {
      type: "argument",
      name: "project",
      placeholder: "Project name",
      valueType: "entity",
      entityType: "project",
      required: true,
    },
  ],

  execute: async ({ entities, refetch }) => {
    const projectId: number = entities.project?.id;

    if (!projectId) throw new Error("Project is required");

    const res = await fetch(`/api/projects?id=${projectId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to delete project");
    }

    await refetch.projects();
  },
};
