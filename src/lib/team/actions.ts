"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/lib/mail";

export type FormState = { error?: string; success?: string } | null;

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

export async function createTeamMemberAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can add team members." };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") || "MEMBER") as
    | "ADMIN"
    | "MEMBER";

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return { error: "A user with that email already exists." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await db.insert(users).values({ name, email, passwordHash, role });

  const result = await sendWelcomeEmail({
    to: email,
    name,
    tempPassword,
    appUrl: getAppUrl(),
  });

  revalidatePath("/team");

  if (!result.sent) {
    return {
      success: `Added ${name}, but the welcome email could not be sent. Temporary password: ${tempPassword}`,
    };
  }

  return { success: `Added ${name} and emailed them their login details.` };
}

export async function deleteTeamMemberAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const userId = Number(formData.get("userId"));
  if (!userId || userId === admin.id) return;

  const assigned = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.assigneeId, userId));

  if (assigned.length > 0) {
    // Refuse to delete a team member who still has tasks assigned.
    return;
  }

  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/team");
}

export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!user) return { error: "Not signed in." };

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) {
    return { error: "Please fill in both fields." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  return { success: "Password updated." };
}
