"use server";

import { db } from "@/lib/db";
import { clients, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export type FormState = { error?: string; success?: string } | null;

export async function createClientAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can add clients." };

  const name = String(formData.get("name") || "").trim();
  const contactName = String(formData.get("contactName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) return { error: "Client name is required." };

  await db.insert(clients).values({
    name,
    contactName: contactName || null,
    contactEmail: contactEmail || null,
    notes: notes || null,
  });

  revalidatePath("/clients");
  return { success: `Added client "${name}".` };
}

export async function deleteClientAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const clientId = Number(formData.get("clientId"));
  if (!clientId) return;

  const existingTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.clientId, clientId));

  if (existingTasks.length > 0) {
    // Refuse to delete a client that still has tasks; keep data intact.
    return;
  }

  await db.delete(clients).where(eq(clients.id, clientId));
  revalidatePath("/clients");
}
