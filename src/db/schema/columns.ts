import { projects } from "./projects";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const columns = sqliteTable("columns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  project_id: integer("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  order: integer("order").notNull(),
});
