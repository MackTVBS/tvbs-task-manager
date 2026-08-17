import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// IMPORTANT: this connection must be created lazily, not at module load time.
// Next.js imports this module tree while building (e.g. to collect page
// data), which happens in an environment where a host's persistent disk
// (e.g. Render's /data mount) is not attached yet. Opening the SQLite file
// as a top-level side effect would crash the build. Everything below only
// touches the filesystem the first time a query actually runs, at request
// time, when the real disk is mounted.
let _sqlite: Database.Database | null = null;
let _db: DrizzleDb | null = null;

function getConnection() {
  if (_sqlite && _db) return { sqlite: _sqlite, db: _db };

  const dbPath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _sqlite = new Database(dbPath);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("foreign_keys = ON");
  _db = drizzle(_sqlite, { schema });

  return { sqlite: _sqlite, db: _db };
}

function lazyProxy<T extends object>(pick: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, _receiver) {
      const target = pick();
      const value = (target as any)[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export const db: DrizzleDb = lazyProxy(() => getConnection().db);
export const sqlite: Database.Database = lazyProxy(
  () => getConnection().sqlite
);
