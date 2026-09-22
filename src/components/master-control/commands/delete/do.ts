import type { SubCommand } from "../types";

export const deleteDo: SubCommand = {
  name: "do",
  description: "Delete a do",

  parts: [
    {
      type: "argument",
      name: "project",
      placeholder: "Project Name",
      valueType: "entity",
      entityType: "project",
      required: true,
    },
    {
      type: "argument",
      name: "do",
      placeholder: "Do title",
      valueType: "entity",
      entityType: "do",
      required: true,
    },
  ],

  execute: async ({ args, entities, projectId: currentProjectId, refetch }) => {
    const doId: number = entities.do?.id;

    if (!doId) throw new Error(`Do "${args.do || ""}" not found`);

    const res = await fetch(`/api/dos/${doId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Failed to delete do");
    }

    await refetch.dos();

    if (currentProjectId) await refetch.kanban?.();
  },
};
