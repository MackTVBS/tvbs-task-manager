import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { listTasks } from "@/lib/db/queries";
import { sendTaskReminderEmail } from "@/lib/mail";
import { todayInTz } from "@/lib/date";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("x-cron-secret");
  const query = request.nextUrl.searchParams.get("secret");
  return header === secret || query === secret;
}

function getAppUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayInTz(0);
  const tomorrow = todayInTz(1);

  const all = await listTasks();
  const candidates = all.filter((t) => t.status !== "COMPLETED" && t.assigneeEmail);

  const results: { taskId: number; sent: boolean; reason: string }[] = [];

  for (const task of candidates) {
    let status: "overdue" | "due-today" | "due-soon" | null = null;
    if (task.dueDate < today) status = "overdue";
    else if (task.dueDate === today) status = "due-today";
    else if (task.dueDate === tomorrow) status = "due-soon";

    if (!status) continue;

    // Avoid sending more than one reminder per task per day, even if this
    // endpoint is triggered multiple times (e.g. retried cron runs).
    const alreadySentToday =
      task.completedAt === null &&
      (await taskReminderSentOn(task.id, today));

    if (alreadySentToday) {
      results.push({ taskId: task.id, sent: false, reason: "already-sent-today" });
      continue;
    }

    const result = await sendTaskReminderEmail({
      to: task.assigneeEmail!,
      assigneeName: task.assigneeName || "there",
      taskTitle: task.title,
      clientName: task.clientName,
      dueDate: task.dueDate,
      status,
      appUrl: getAppUrl(),
      taskId: task.id,
    });

    if (result.sent) {
      await db
        .update(tasks)
        .set({ reminderEmailSentAt: new Date().toISOString() })
        .where(eq(tasks.id, task.id));
    }

    results.push({ taskId: task.id, sent: result.sent, reason: status });
  }

  return NextResponse.json({ checked: candidates.length, results });
}

async function taskReminderSentOn(taskId: number, dateStr: string) {
  const rows = await db
    .select({ reminderEmailSentAt: tasks.reminderEmailSentAt })
    .from(tasks)
    .where(eq(tasks.id, taskId));
  const sentAt = rows[0]?.reminderEmailSentAt;
  if (!sentAt) return false;
  return sentAt.slice(0, 10) === dateStr;
}
