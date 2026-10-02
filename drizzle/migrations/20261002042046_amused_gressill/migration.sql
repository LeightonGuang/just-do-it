ALTER TABLE `columns`
ADD `is_done` integer NOT NULL DEFAULT 0;
--> statement-breakpoint

CREATE UNIQUE INDEX `one_done_column_per_project`
ON `columns` (`project_id`)
WHERE "columns"."is_done" = 1;
