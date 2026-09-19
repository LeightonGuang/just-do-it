import type { SubCommand } from "../registry";

export const createDo: SubCommand = {
  name: "do",
  description: "Create a new do",
  parts: [
    {
      type: "argument",
      argument: {
        required: true,
        name: "name",
        placeholder: "Do name",
        inputType: "text",
      },
    },
  ],
  execute: async ({ args }) => {
    const res = await fetch("/api/dos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as {
        error?: string;
      };

      throw new Error(data.error ?? "Failed to create task");
    }
  },
};
