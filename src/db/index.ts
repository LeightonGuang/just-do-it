import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/index";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema } as Parameters<typeof drizzle>[1]);
}
