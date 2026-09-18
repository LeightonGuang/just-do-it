import type { SubCommand } from "../registry";

export const deleteProject: SubCommand = {
  name: "project",
  description: "Delete a project",
  parts: [
    {
      type: "argument",
      argument: {
        name: "name",
        placeholder: "Project name",
        inputType: "text",
      },
    },
  ],
  execute: async ({ args, refetch }) => {
    const res = await fetch(`/api/projects/${args.id}`, {
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
