import { migrate } from "drizzle-orm/libsql/migrator";
import { db, client } from "./index";
import path from "path";

async function run() {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Migrations applied.");
  client.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
