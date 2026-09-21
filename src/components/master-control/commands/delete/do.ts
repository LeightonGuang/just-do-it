import type { SubCommand } from "../types";

export const deleteDo: SubCommand = {
  name: "do",
  description: "Delete a do",

  parts: [
    {
      type: "argument",
      name: "do",
      placeholder: "Do title",
      valueType: "entity",
      entityType: "do",
      required: true,
    },
  ],

  execute: async ({ args, entities, refetch }) => {
    let doId: number | undefined = entities.do?.id;

    if (!doId && args.do) {
      const res = await fetch(`/api/tasks?title=${encodeURIComponent(args.do.trim())}`);
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

    const res = await fetch(`/api/tasks?id=${doId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to delete do");
    }

    await refetch.dos();
  },
};
