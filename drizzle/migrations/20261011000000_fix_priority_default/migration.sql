-- Add default value for priority column to allow NULL
-- SQLite doesn't support direct ALTER COLUMN DEFAULT, so we need to recreate the table

BEGIN TRANSACTION;

-- Create new dos table with correct schema
CREATE TABLE dos_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT NULL,
  start_at INTEGER,
  end_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (column_id) REFERENCES columns(id)
);

-- Copy data from old dos to new dos, preserving existing values
INSERT INTO dos_new 
  (id, column_id, project_id, title, description, priority, start_at, end_at, created_at, updated_at)
SELECT 
  id, 
  column_id, 
  project_id, 
  title, 
  description, 
  CASE WHEN priority IS NULL OR priority = '' THEN NULL ELSE priority END, 
  start_at, 
  end_at, 
  created_at, 
  updated_at
FROM dos;

-- Drop old dos table and rename new one
DROP TABLE dos;
ALTER TABLE dos_new RENAME TO dos;

COMMIT;