import type { SubCommand } from "../types";

export const createProject: SubCommand = {
  name: "project",
  description: "Create a new project",

  parts: [
    {
      type: "argument",
      name: "name",
      placeholder: "Project name",
      valueType: "text",
      required: true,
    },
    {
      type: "argument",
      name: "colour",
      placeholder: "#hex color",
      valueType: "color",
      required: false,
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
        colour: args.colour || undefined,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to create project");
    }

    await refetch.projects();
  },
};
