CREATE TABLE `columns` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`is_done` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_columns_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `dos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`column_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_at` integer,
	`end_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_dos_column_id_columns_id_fk` FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_dos_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`colour` text DEFAULT '#000000' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `one_done_column_per_project` ON `columns` (`project_id`) WHERE "columns"."is_done" = 1;