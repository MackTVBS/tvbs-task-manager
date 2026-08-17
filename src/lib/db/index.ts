import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// IMPORTANT: this connection must be created lazily, not at module load
// time. Next.js imports this module tree while building (e.g. to collect
// page data), and touching the database as a top-level side effect can
// crash the build in hosts that don't have things set up yet at build time.
// Everything below only runs the first time a query actually executes, at
// request time.
let _client: Client | null = null;
let _db: DrizzleDb | null = null;

function getConnection() {
  if (_client && _db) return { client: _client, db: _db };

  // Production: point at a free Turso database (no local disk needed, so no
  // paid persistent disk required on the host). Local dev: falls back to a
  // plain local file, no Turso account required.
  const url =
    process.env.TURSO_DATABASE_URL ||
    `file:${path.join(process.cwd(), "data", "app.db")}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _client = createClient(authToken ? { url, authToken } : { url });
  _db = drizzle(_client, { schema });

  return { client: _client, db: _db };
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
export const client: Client = lazyProxy(() => getConnection().client);
