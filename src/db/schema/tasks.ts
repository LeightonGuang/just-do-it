import { columns } from "./columns";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  column_id: integer("column_id")
    .notNull()
    .references(() => columns.id),
  title: text("title").notNull(),
  description: text("description"),
});
