-- Restore the ordering field used by the Kanban board.
ALTER TABLE dos ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
