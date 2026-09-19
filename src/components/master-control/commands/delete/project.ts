import type { SubCommand } from "../registry";

export const deleteProject: SubCommand = {
  name: "project",
  description: "Delete a project",
  parts: [
    {
      type: "argument",
      argument: {
        required: true,
        name: "name",
        placeholder: "Project name",
        inputType: "text",
      },
    },
  ],
  execute: async ({ entities, refetch }) => {
    const project = entities.project;

    if (!project || project.type !== "project") {
      throw new Error("Project is required");
    }

    const res = await fetch(`/api/projects?id=${project.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
      };

      throw new Error(data.error ?? "Failed to delete project");
    }

    await refetch.projects();
  },
};
