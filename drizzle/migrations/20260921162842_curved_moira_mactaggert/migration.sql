CREATE TABLE `columns` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`project_id` integer NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	CONSTRAINT `fk_columns_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);
--> statement-breakpoint
CREATE TABLE `dos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`column_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT `fk_dos_column_id_columns_id_fk` FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`),
	CONSTRAINT `fk_dos_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`colour` text DEFAULT '#000000' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
