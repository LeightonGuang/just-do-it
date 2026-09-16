import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  colour: text("color").notNull().default("#000000"), // hex code
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Project = typeof projects.$inferSelect;

export const columns = sqliteTable("columns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});

export type Column = typeof columns.$inferSelect;

export const dos = sqliteTable("dos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  column_id: integer("column_id")
    .notNull()
    .references(() => columns.id),
  title: text("title").notNull(),
  description: text("description"),
  due_at: integer("due_at", { mode: "timestamp_ms" }),
});

export type Do = typeof dos.$inferSelect;
