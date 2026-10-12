import type { Column, Project } from "../../../db";

export type KanbanTag = {
  id: number;
  name: string;
  colour: string;
};

export type KanbanDo = {
  id: number;
  title: string;
  description: string | null;

  project_id: number;
  project_name: string;
  project_colour: string;

  column_id: number;

  position: number;

  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;

  tags: KanbanTag[];
};

// Column reordering state types
export type KanbanBoardState = {
  draggedColumnId: number | null;
  dragOverColumnForReorder: number | null;
  movingColumnId: number | null;
};

export type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: KanbanDo[];
};