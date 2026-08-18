"use server";

import { db } from "@/lib/db";
import { recurringTasks, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = { error?: string; success?: string } | null;

const VALID_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export async function createRecurringTaskAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can create recurring tasks." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const clientId = Number(formData.get("clientId"));
  const assigneeId = Number(formData.get("assigneeId"));
  const priority = String(formData.get("priority") || "MEDIUM") as
    | "LOW"
    | "MEDIUM"
    | "HIGH";
  const dueTimeRaw = String(formData.get("dueTime") || "").trim();
  const dueTime = /^\d{2}:\d{2}$/.test(dueTimeRaw) ? dueTimeRaw : null;
  const days = VALID_DAYS.filter((d) => formData.get(`day_${d}`) === "on");

  if (!title || !clientId || !assigneeId) {
    return { error: "Please fill in all required fields." };
  }
  if (days.length === 0) {
    return { error: "Pick at least one day of the week." };
  }

  await db.insert(recurringTasks).values({
    title,
    description: description || null,
    clientId,
    assigneeId,
    createdById: admin.id,
    priority,
    daysOfWeek: days.join(","),
    dueTime,
    active: true,
  });

  revalidatePath("/recurring");
  redirect("/recurring");
}

export async function toggleRecurringTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const id = Number(formData.get("id"));
  const nextActive = formData.get("nextActive") === "true";
  if (!id) return;

  await db
    .update(recurringTasks)
    .set({ active: nextActive })
    .where(eq(recurringTasks.id, id));

  revalidatePath("/recurring");
}

export async function deleteRecurringTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const id = Number(formData.get("id"));
  if (!id) return;

  // Keep any already-generated task instances (history) but detach them
  // from the template being deleted.
  await db
    .update(tasks)
    .set({ recurringTaskId: null })
    .where(eq(tasks.recurringTaskId, id));

  await db.delete(recurringTasks).where(eq(recurringTasks.id, id));

  revalidatePath("/recurring");
}
