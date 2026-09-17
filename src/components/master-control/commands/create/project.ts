import type { SubCommand } from "../registry";

export const createProject: SubCommand = {
  name: "project",
  description: "Create a new project",
  parts: [
    {
      type: "argument",
      argument: {
        name: "name",
        placeholder: "Project name",
      },
    },
    {
      type: "argument",
      argument: {
        name: "colour",
        placeholder: "#000000",
      },
    },
  ],
  execute: async ({ args, refetch }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        colour: args.colour,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
      };

      throw new Error(data.error ?? "Failed to create project");
    }

    await refetch.projects();
  },
};
