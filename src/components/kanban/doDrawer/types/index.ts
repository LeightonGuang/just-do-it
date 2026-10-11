import type { Column } from "../../../../db";

export type CreateDoData = {
  title: string;
  project_id?: number;
  column_id?: number;
  description?: string;
  start_at?: string;
  end_at?: string;
};

type FormValues = {
  title: string;
  description: string;
  columnId: string;
  tagId: string;
  startAt: string;
  endAt: string;
};

export type DoDrawerProps = {
  doId: number | null;
  onClose: () => void;
  onCreate?: (data: CreateDoData) => Promise<void>;
  isCreating?: boolean;
  createColumnId?: number;
};

// Move-related types for drag-and-drop functionality
export type MoveDORequest = { id: number; column_id: number };
export type MoveDOResponse = { id: number; column_id: number; project_id: number };

export type KanbanDo = {
  id: number;
  title?: string | null;
  description?: string | null;
  column_id: number | null;
  project_id: number | null;
};

export type KanbanTag = {
  id: number;
  name: string;
};