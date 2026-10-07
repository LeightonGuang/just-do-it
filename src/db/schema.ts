import { sql } from "drizzle-orm";
import { uniqueIndex } from "drizzle-orm/sqlite-core";
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
  ], // only one is done column can exist per project
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

  priority: text("priority", { enum: ["low", "mid", "high"] }),

  // position: integer("position").notNull(),

  start_at: integer("start_at", { mode: "timestamp_ms" }),
  end_at: integer("end_at", { mode: "timestamp_ms" }),

  created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Do = typeof dos.$inferSelect;

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
