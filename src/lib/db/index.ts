import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool?: mysql.Pool;
};

const url = process.env.DATABASE_URL ?? "mysql://root:@127.0.0.1:3306/soundwave";

export const pool =
  globalForDb.pool ??
  mysql.createPool(
    `${url}${url.includes("?") ? "&" : "?"}connectionLimit=10&timezone=Z`,
  );

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema, mode: "default" });
