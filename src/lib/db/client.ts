import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type AppDb = ReturnType<typeof drizzle<typeof schema>>;
type SqlClient = ReturnType<typeof postgres>;

declare global {
  var __miCopiDb: AppDb | undefined;
  var __miCopiSql: SqlClient | undefined;
}

export function getDb(): AppDb {
  if (globalThis.__miCopiDb) {
    return globalThis.__miCopiDb;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sql = globalThis.__miCopiSql ?? postgres(databaseUrl);
  const db = globalThis.__miCopiDb ?? drizzle(sql, { schema });

  globalThis.__miCopiSql = sql;
  globalThis.__miCopiDb = db;

  return db;
}

export type { AppDb };
