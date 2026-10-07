CREATE TABLE `do_tags` (
	`do_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	CONSTRAINT `fk_do_tags_do_id_dos_id_fk` FOREIGN KEY (`do_id`) REFERENCES `dos`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_do_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`name` text NOT NULL,
	`colour` text DEFAULT '#000000' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `do_tags_unique` ON `do_tags` (`do_id`,`tag_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);