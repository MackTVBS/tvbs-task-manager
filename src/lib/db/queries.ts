import { db } from "./index";
import { tasks, clients, users, recurringTasks } from "./schema";
import { eq, asc, and } from "drizzle-orm";

export type TaskListItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  dueTime: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  completedAt: string | null;
  createdAt: string;
  clientId: number;
  clientName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  recurringTaskId: number | null;
  replyToken: string | null;
};

const taskListColumns = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  dueDate: tasks.dueDate,
  dueTime: tasks.dueTime,
  status: tasks.status,
  priority: tasks.priority,
  completedAt: tasks.completedAt,
  createdAt: tasks.createdAt,
  clientId: clients.id,
  clientName: clients.name,
  assigneeId: users.id,
  assigneeName: users.name,
  assigneeEmail: users.email,
  recurringTaskId: tasks.recurringTaskId,
  replyToken: tasks.replyToken,
};

export async function listTasks(): Promise<TaskListItem[]> {
  const rows = await db
    .select(taskListColumns)
    .from(tasks)
    .innerJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .orderBy(asc(tasks.dueDate));

  return rows as TaskListItem[];
}

export async function getTaskById(id: number) {
  const rows = await db
    .select(taskListColumns)
    .from(tasks)
    .innerJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.id, id));

  return (rows[0] as TaskListItem | undefined) ?? null;
}

export async function getTaskByReplyToken(token: string) {
  const rows = await db
    .select(taskListColumns)
    .from(tasks)
    .innerJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.replyToken, token));

  return (rows[0] as TaskListItem | undefined) ?? null;
}

export async function getTaskInstanceForToday(
  recurringTaskId: number,
  dueDate: string
) {
  const rows = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.recurringTaskId, recurringTaskId),
        eq(tasks.dueDate, dueDate)
      )
    );
  return rows[0] ?? null;
}

export async function listClients() {
  return db.select().from(clients).orderBy(asc(clients.name));
}

export async function listUsers() {
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getClientById(id: number) {
  const rows = await db.select().from(clients).where(eq(clients.id, id));
  return rows[0] ?? null;
}

export type RecurringTaskListItem = {
  id: number;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  daysOfWeek: string;
  dueTime: string | null;
  active: boolean;
  clientId: number;
  clientName: string;
  assigneeId: number;
  assigneeName: string;
  assigneeEmail: string;
};

const recurringTaskColumns = {
  id: recurringTasks.id,
  title: recurringTasks.title,
  description: recurringTasks.description,
  priority: recurringTasks.priority,
  daysOfWeek: recurringTasks.daysOfWeek,
  dueTime: recurringTasks.dueTime,
  active: recurringTasks.active,
  clientId: clients.id,
  clientName: clients.name,
  assigneeId: users.id,
  assigneeName: users.name,
  assigneeEmail: users.email,
};

export async function listRecurringTasks(): Promise<RecurringTaskListItem[]> {
  const rows = await db
    .select(recurringTaskColumns)
    .from(recurringTasks)
    .innerJoin(clients, eq(recurringTasks.clientId, clients.id))
    .innerJoin(users, eq(recurringTasks.assigneeId, users.id))
    .orderBy(asc(recurringTasks.title));

  return rows as RecurringTaskListItem[];
}

export async function listActiveRecurringTasks(): Promise<
  RecurringTaskListItem[]
> {
  const rows = await db
    .select(recurringTaskColumns)
    .from(recurringTasks)
    .innerJoin(clients, eq(recurringTasks.clientId, clients.id))
    .innerJoin(users, eq(recurringTasks.assigneeId, users.id))
    .where(eq(recurringTasks.active, true));

  return rows as RecurringTaskListItem[];
}
