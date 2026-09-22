import type { SubCommand } from "../types";

export const editDo: SubCommand = {
  name: "do",
  description: "Update a do title",

  parts: [
    {
      type: "argument",
      name: "do",
      placeholder: "Do title",
      valueType: "entity",
      entityType: "do",
      required: true,
    },
    {
      type: "keyword",
      value: "title",
    },
    {
      type: "argument",
      name: "title",
      placeholder: "New title",
      valueType: "text",
      required: true,
      greedy: true,
    },
  ],

  execute: async ({ args, entities, refetch }) => {
    let doId: number | undefined = entities.do?.id;

    if (!doId && args.do) {
      const res = await fetch(
        `/api/dos?title=${encodeURIComponent(args.do.trim())}`,
      );
      if (res.ok) {
        const found = await res.json();
        if (Array.isArray(found) && found.length > 0) {
          doId = found[0].id;
        }
      }
    }

    if (!doId) {
      throw new Error(`Do "${args.do || ""}" not found`);
    }

    if (!args.title || !args.title.trim()) {
      throw new Error("New title is required");
    }

    const res = await fetch("/api/dos", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: doId,
        title: args.title.trim(),
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to update do");
    }

    await refetch.dos();
  },
};
