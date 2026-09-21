import type { SubCommand } from "../types";

export const moveDo: SubCommand = {
  name: "do",
  description: "Move a do to another column",

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
      value: "to",
    },
    {
      type: "argument",
      name: "column",
      placeholder: "Column name",
      valueType: "entity",
      entityType: "column",
      required: true,
    },
  ],

  execute: async ({ args, entities, refetch }) => {
    let doId: number | undefined = entities.do?.id;
    let columnId: number | undefined = entities.column?.id;

    if (!doId && args.do) {
      const res = await fetch(`/api/tasks?title=${encodeURIComponent(args.do.trim())}`);
      if (res.ok) {
        const found = await res.json();
        if (Array.isArray(found) && found.length > 0) {
          doId = found[0].id;
        }
      }
    }

    if (!columnId && args.column) {
      const res = await fetch(`/api/columns?name=${encodeURIComponent(args.column.trim())}`);
      if (res.ok) {
        const found = await res.json();
        if (Array.isArray(found) && found.length > 0) {
          columnId = found[0].id;
        }
      }
    }

    if (!doId) {
      throw new Error(`Do "${args.do || ""}" not found`);
    }

    if (!columnId) {
      throw new Error(`Column "${args.column || ""}" not found`);
    }

    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: doId,
        column_id: columnId,
      }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to move do");
    }

    await refetch.dos();
  },
};
