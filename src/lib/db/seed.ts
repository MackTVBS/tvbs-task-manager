import bcrypt from "bcryptjs";
import { db, sqlite } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@tvbs.tech";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME || "TVBS Admin";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail));

  if (existing.length > 0) {
    console.log(`Admin user ${adminEmail} already exists. Skipping.`);
    sqlite.close();
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await db.insert(users).values({
    name: adminName,
    email: adminEmail,
    passwordHash,
    role: "ADMIN",
  });

  console.log("Seeded admin user:");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("Please log in and change this password / create real users.");
  sqlite.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
