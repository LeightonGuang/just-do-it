-- Recurrence rules are kept separate from tasks so changing a rule does not
-- rewrite occurrence history.
CREATE TABLE `do_recurrences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `do_id` integer NOT NULL,
  `weekdays` text NOT NULL,
  `start_date` text NOT NULL,
  `end_date` text,
  `interval_weeks` integer NOT NULL DEFAULT 1,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`do_id`) REFERENCES `dos`(`id`) ON DELETE cascade
);
CREATE UNIQUE INDEX `do_recurrences_one_per_do` ON `do_recurrences` (`do_id`);
CREATE TABLE `do_occurrences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `do_id` integer NOT NULL,
  `recurrence_id` integer NOT NULL,
  `occurrence_date` text NOT NULL,
  `status` text NOT NULL DEFAULT 'pending',
  `completed_at` integer,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`do_id`) REFERENCES `dos`(`id`) ON DELETE cascade,
  FOREIGN KEY (`recurrence_id`) REFERENCES `do_recurrences`(`id`) ON DELETE cascade
);
CREATE UNIQUE INDEX `do_occurrences_recurrence_date` ON `do_occurrences` (`recurrence_id`, `occurrence_date`);
CREATE INDEX `do_occurrences_do_date` ON `do_occurrences` (`do_id`, `occurrence_date`);
