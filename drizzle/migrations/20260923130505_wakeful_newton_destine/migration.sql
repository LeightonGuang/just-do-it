ALTER TABLE `dos` RENAME COLUMN `due_at` TO `end_at`;--> statement-breakpoint
ALTER TABLE `dos` ADD `start_at` integer;