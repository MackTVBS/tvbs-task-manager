import { db } from "./index";
import { tasks, clients, users } from "./schema";
import { eq, asc, desc } from "drizzle-orm";

export type TaskListItem = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  completedAt: string | null;
  createdAt: string;
  clientId: number;
  clientName: string;
  assigneeId: number | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

export async function listTasks(): Promise<TaskListItem[]> {
  const assignees = users;
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      status: tasks.status,
      priority: tasks.priority,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      clientId: clients.id,
      clientName: clients.name,
      assigneeId: assignees.id,
      assigneeName: assignees.name,
      assigneeEmail: assignees.email,
    })
    .from(tasks)
    .innerJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .orderBy(asc(tasks.dueDate));

  return rows as TaskListItem[];
}

export async function getTaskById(id: number) {
  const assignees = users;
  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueDate: tasks.dueDate,
      status: tasks.status,
      priority: tasks.priority,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      clientId: clients.id,
      clientName: clients.name,
      assigneeId: assignees.id,
      assigneeName: assignees.name,
      assigneeEmail: assignees.email,
    })
    .from(tasks)
    .innerJoin(clients, eq(tasks.clientId, clients.id))
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .where(eq(tasks.id, id));

  return (rows[0] as TaskListItem | undefined) ?? null;
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
