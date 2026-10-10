import type { Column, Project } from "../../db/schema";

export type KanbanTag = {
  id: number;
  name: string;
  colour: string;
};

export type KanbanDo = {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "mid" | "high" | null;

  project_id: number;
  project_name: string;
  project_colour: string;

  column_id: number;

  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;

  tags: KanbanTag[];
};

export type KanbanResponse = {
  project: Project;
  columns: Column[];
  dos: KanbanDo[];
};