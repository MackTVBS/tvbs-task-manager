import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { listActiveRecurringTasks, getTaskInstanceForToday } from "@/lib/db/queries";
import { sendTaskAssignedEmail } from "@/lib/mail";
import { todayInTz, todayDayCodeInTz } from "@/lib/date";
import { generateReplyToken } from "@/lib/tokens";

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
  const todayCode = todayDayCodeInTz(0);
  const now = new Date().toISOString();

  const templates = await listActiveRecurringTasks();
  const dueToday = templates.filter((t) =>
    t.daysOfWeek.split(",").includes(todayCode)
  );

  const results: {
    recurringTaskId: number;
    title: string;
    created: boolean;
    emailed: boolean;
    reason: string;
  }[] = [];

  for (const template of dueToday) {
    // Idempotent: if this template already produced today's instance
    // (e.g. this endpoint got called twice), don't duplicate it.
    const existing = await getTaskInstanceForToday(template.id, today);
    if (existing) {
      results.push({
        recurringTaskId: template.id,
        title: template.title,
        created: false,
        emailed: false,
        reason: "already-generated-today",
      });
      continue;
    }

    const replyToken = generateReplyToken();

    const [inserted] = await db
      .insert(tasks)
      .values({
        title: template.title,
        description: template.description,
        clientId: template.clientId,
        assigneeId: template.assigneeId,
        createdById: null,
        recurringTaskId: template.id,
        dueDate: today,
        dueTime: template.dueTime,
        // Recurring tasks start as "in progress" the moment they're sent,
        // per how TVBS runs day-to-day work.
        status: "IN_PROGRESS",
        priority: template.priority,
        replyToken,
        // Mark as already reminded-today so the separate /api/cron/reminders
        // job doesn't also send a "due today" email a few minutes later.
        reminderEmailSentAt: now,
      })
      .returning({ id: tasks.id });

    const result = await sendTaskAssignedEmail({
      to: template.assigneeEmail,
      assigneeName: template.assigneeName,
      taskTitle: template.title,
      taskDescription: template.description,
      clientName: template.clientName,
      dueDate: today,
      dueTime: template.dueTime,
      priority: template.priority,
      appUrl: getAppUrl(),
      taskId: inserted.id,
      replyToken,
    });

    if (result.sent) {
      await db
        .update(tasks)
        .set({ assignEmailSentAt: now })
        .where(eq(tasks.id, inserted.id));
    }

    results.push({
      recurringTaskId: template.id,
      title: template.title,
      created: true,
      emailed: result.sent,
      reason: "generated",
    });
  }

  return NextResponse.json({
    date: today,
    dayCode: todayCode,
    templatesActive: templates.length,
    templatesDueToday: dueToday.length,
    results,
  });
}
