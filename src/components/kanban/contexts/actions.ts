import type { Project, Column } from "../../../db";
import type { KanbanDo, KanbanResponse, KanbanTag } from "./types";

/** Fetch all Kanban data for a project */
export const fetchKanban = async (projectId: string | null) => {
  if (!projectId) {
    return {
      project: null as Project | null,
      columns: [],
      dos: [],
      tags: [],
    };
  }

  const [kanbanResponse, tagsResponse] = await Promise.all([
    fetch(`/api/projects/${projectId}`, {
      cache: "no-store",
    }),
    fetch("/api/tags", {
      cache: "no-store",
    }),
  ]);

  if (!kanbanResponse.ok) {
    throw new Error("Failed to fetch Kanban");
  }

  if (!tagsResponse.ok) {
    throw new Error("Failed to fetch tags");
  }

  const data = (await kanbanResponse.json()) as KanbanResponse;
  const tagData = (await tagsResponse.json()) as KanbanTag[];

  // Make sure every task always has a tags array.
  return {
    project: data.project,
    columns: data.columns,
    dos: data.dos.map((doItem) => ({
      ...doItem,
      tags: Array.isArray(doItem.tags) ? doItem.tags : [],
    })),
    tags: tagData,
  };
};

/** Edit project name and colour */
export const editProject = async (
  projectId: string | null,
  name: string,
  colour: string,
) => {
  if (!projectId) return;

  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, colour }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Failed to edit project");
  }

  const data = (await response.json()) as { project: Project };
  return data.project;
};

/** Move a DO to a different column */
export const moveDo = async (
  projectId: string | null,
  doId: number,
  columnId: number,
) => {
  if (!projectId) return;

  try {
    const response = await fetch(`/api/dos/${doId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ column_id: columnId }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      throw new Error(data.error || "Failed to move card");
    }
  } catch (error) {
    throw error; // Rollback handled by caller
  }
};

/** Edit a column's name */
export const editColumn = async (columnId: number, name: string) => {
  const response = await fetch(`/api/columns/${columnId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Failed to edit column");
  }

  const data = (await response.json()) as { column: Column };
  return data.column;
};

/** Delete a column and its contents */
export const deleteColumn = async (columnId: number, dos: KanbanDo[]) => {
  const response = await fetch(`/api/columns/${columnId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Failed to delete column");
  }

  // Remove column from columns array and dos array
  const removedDos = dos.filter((doItem) => doItem.column_id !== columnId);
  return removedDos;
};

/** Update a column's done status */
export const setColumnIsDone = async (columnId: number, isDone: boolean) => {
  const response = await fetch(`/api/columns/${columnId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isDone }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error || "Failed to update column");
  }

  const data = (await response.json()) as { column: Column };
  return data.column;
};
