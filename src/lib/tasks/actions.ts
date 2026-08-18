"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTaskById } from "@/lib/db/queries";
import { sendTaskAssignedEmail } from "@/lib/mail";
import { generateReplyToken } from "@/lib/tokens";
import { todayInTz } from "@/lib/date";

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export type FormState = { error?: string; success?: string } | null;

export async function createTaskAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can create tasks." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const clientId = Number(formData.get("clientId"));
  const assigneeId = Number(formData.get("assigneeId"));
  const dueDate = String(formData.get("dueDate") || "");
  const dueTimeRaw = String(formData.get("dueTime") || "").trim();
  const dueTime = /^\d{2}:\d{2}$/.test(dueTimeRaw) ? dueTimeRaw : null;
  const priority = String(formData.get("priority") || "MEDIUM") as
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  if (!title || !clientId || !assigneeId || !dueDate) {
    return { error: "Please fill in all required fields." };
  }

  const replyToken = generateReplyToken();

  const [inserted] = await db
    .insert(tasks)
    .values({
      title,
      description: description || null,
      clientId,
      assigneeId,
      createdById: admin.id,
      dueDate,
      dueTime,
      priority,
      status: "PENDING",
      replyToken,
    })
    .returning({ id: tasks.id });

  const task = await getTaskById(inserted.id);
  if (task && task.assigneeEmail) {
    const result = await sendTaskAssignedEmail({
      to: task.assigneeEmail,
      assigneeName: task.assigneeName || "there",
      taskTitle: task.title,
      taskDescription: task.description,
      clientName: task.clientName,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      priority: task.priority,
      appUrl: getAppUrl(),
      taskId: task.id,
      replyToken,
    });
    const now = new Date().toISOString();
    await db
      .update(tasks)
      .set({
        assignEmailSentAt: result.sent ? now : null,
        // If it's due today, this assignment email already told the
        // assignee — don't also fire a "due today" reminder minutes later.
        ...(result.sent && dueDate === todayInTz(0)
          ? { reminderEmailSentAt: now }
          : {}),
      })
      .where(eq(tasks.id, task.id));
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!user) return;

  const taskId = Number(formData.get("taskId"));
  const status = String(formData.get("status")) as
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED";

  if (!taskId || !status) return;

  const existing = await getTaskById(taskId);
  if (!existing) return;

  // Only the assignee or an admin may update status.
  if (user.role !== "ADMIN" && existing.assigneeId !== user.id) return;

  await db
    .update(tasks)
    .set({
      status,
      completedAt: status === "COMPLETED" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin) return;

  const taskId = Number(formData.get("taskId"));
  if (!taskId) return;

  await db.delete(tasks).where(eq(tasks.id, taskId));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateTaskAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Only admins can edit tasks." };

  const taskId = Number(formData.get("taskId"));
  const existing = await getTaskById(taskId);
  if (!existing) return { error: "Task not found." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const clientId = Number(formData.get("clientId"));
  const assigneeId = Number(formData.get("assigneeId"));
  const dueDate = String(formData.get("dueDate") || "");
  const dueTimeRaw = String(formData.get("dueTime") || "").trim();
  const dueTime = /^\d{2}:\d{2}$/.test(dueTimeRaw) ? dueTimeRaw : null;
  const priority = String(formData.get("priority") || "MEDIUM") as
    | "LOW"
    | "MEDIUM"
    | "HIGH";

  if (!title || !clientId || !assigneeId || !dueDate) {
    return { error: "Please fill in all required fields." };
  }

  const assigneeChanged = existing.assigneeId !== assigneeId;
  const dueDateChanged = existing.dueDate !== dueDate;

  await db
    .update(tasks)
    .set({
      title,
      description: description || null,
      clientId,
      assigneeId,
      dueDate,
      dueTime,
      priority,
      updatedAt: new Date().toISOString(),
      // Reset reminder tracking if the due date moved, so reminders re-fire correctly.
      ...(dueDateChanged ? { reminderEmailSentAt: null } : {}),
    })
    .where(eq(tasks.id, taskId));

  if (assigneeChanged) {
    const updated = await getTaskById(taskId);
    if (updated && updated.assigneeEmail) {
      await sendTaskAssignedEmail({
        to: updated.assigneeEmail,
        assigneeName: updated.assigneeName || "there",
        taskTitle: updated.title,
        taskDescription: updated.description,
        clientName: updated.clientName,
        dueDate: updated.dueDate,
        dueTime: updated.dueTime,
        priority: updated.priority,
        appUrl: getAppUrl(),
        taskId: updated.id,
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${taskId}`);
  redirect(`/tasks/${taskId}`);
}
