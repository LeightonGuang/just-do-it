export type CreateDoData = {
  title: string;
  project_id?: number;
  column_id?: number;
  description?: string;
  start_at?: string;
  end_at?: string;
  tags?: Array<{ id: number }> | null;
};

export type DoDrawerProps = {
  doId: number | null;
  onClose: () => void;
  onCreate?: (data: CreateDoData) => Promise<void>;
  onDelete?: (doId: number) => Promise<void>;
  onUpdate?: (task: Partial<KanbanDo> & { id: number; tags?: Array<{ id: number; name?: string; colour?: string }> }) => void;
  isCreating?: boolean;
  createColumnId?: number;
  tags?: KanbanTag[];
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
  start_at?: string | null;
  end_at?: string | null;
};

export type KanbanTag = {
  id: number;
  name: string;
};
