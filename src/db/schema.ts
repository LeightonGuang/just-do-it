import { sql } from "drizzle-orm";
import { index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  colour: text("colour").notNull().default("#000000"), // hex code
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Project = typeof projects.$inferSelect;

export const columns = sqliteTable(
  "columns",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    project_id: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    position: integer("position").notNull(),

    is_done: integer("is_done", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    uniqueIndex("one_done_column_per_project")
      .on(table.project_id)
      .where(sql`${table.is_done} = 1`),
  ], // only one done column can exist per project
);

export type Column = typeof columns.$inferSelect;

export const dos = sqliteTable("dos", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  column_id: integer("column_id")
    .notNull()
    .references(() => columns.id, { onDelete: "cascade" }),

  // TODO: remove project id in the future, might be redundant
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description"),

  position: integer("position").default(0),

  start_at: integer("start_at", { mode: "timestamp_ms" }),
  end_at: integer("end_at", { mode: "timestamp_ms" }),

  created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Do = typeof dos.$inferSelect;

/** The current rule for a recurring task. Historical instances live in doOccurrences. */
export const doRecurrences = sqliteTable(
  "do_recurrences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    do_id: integer("do_id")
      .notNull()
      .references(() => dos.id, { onDelete: "cascade" }),
    // JSON array of ISO weekday numbers, Monday = 1 through Sunday = 7.
    weekdays: text("weekdays").notNull(),
    start_date: text("start_date").notNull(),
    end_date: text("end_date"),
    interval_weeks: integer("interval_weeks").notNull().default(1),
    is_active: integer("is_active", { mode: "boolean" })
      .notNull()
      .default(true),
    created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("do_recurrences_one_per_do").on(table.do_id)],
);

export type DoRecurrence = typeof doRecurrences.$inferSelect;

export const doOccurrences = sqliteTable(
  "do_occurrences",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    do_id: integer("do_id")
      .notNull()
      .references(() => dos.id, { onDelete: "cascade" }),
    recurrence_id: integer("recurrence_id")
      .notNull()
      .references(() => doRecurrences.id, { onDelete: "cascade" }),
    occurrence_date: text("occurrence_date").notNull(),
    status: text("status", {
      enum: ["pending", "completed", "skipped", "missed"],
    })
      .notNull()
      .default("pending"),
    completed_at: integer("completed_at", { mode: "timestamp_ms" }),
    created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("do_occurrences_recurrence_date").on(
      table.recurrence_id,
      table.occurrence_date,
    ),
    index("do_occurrences_do_date").on(table.do_id, table.occurrence_date),
  ],
);

export type DoOccurrence = typeof doOccurrences.$inferSelect;

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    name: text("name").notNull(),

    // Optional: useful if tags have colours in your UI
    colour: text("colour").notNull().default("#000000"),

    created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [uniqueIndex("tags_name_unique").on(table.name)],
);

export type Tag = typeof tags.$inferSelect;

export const doTags = sqliteTable(
  "do_tags",
  {
    do_id: integer("do_id")
      .notNull()
      .references(() => dos.id, { onDelete: "cascade" }),

    tag_id: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [uniqueIndex("do_tags_unique").on(table.do_id, table.tag_id)],
);

export type DoTag = typeof doTags.$inferSelect;
