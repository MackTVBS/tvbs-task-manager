import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["ADMIN", "MEMBER"] })
    .notNull()
    .default("MEMBER"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// A recurring task "template". Every morning, the generate-recurring cron
// job turns each active template that's scheduled for today into a real row
// in `tasks` (so history, status, and the existing UI all just work the
// same as for one-off tasks).
export const recurringTasks = sqliteTable("recurring_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  assigneeId: integer("assignee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdById: integer("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  priority: text("priority", { enum: ["LOW", "MEDIUM", "HIGH"] })
    .notNull()
    .default("MEDIUM"),
  // Comma-separated 3-letter day codes this task should fire on, e.g.
  // "MON,TUE,WED,THU,FRI,SAT,SUN". Checked in Asia/Kolkata time.
  daysOfWeek: text("days_of_week").notNull().default("MON,TUE,WED,THU,FRI,SAT,SUN"),
  // Optional daily deadline (HH:MM, 24-hour, Asia/Kolkata) copied onto every
  // day's generated instance. Powers the "time remaining" progress % shown
  // on In Progress tasks. Leave blank for no fixed deadline.
  dueTime: text("due_time"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  assigneeId: integer("assignee_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdById: integer("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Set when this task instance was auto-generated from a recurring
  // template, so we know not to generate a duplicate for the same day.
  recurringTaskId: integer("recurring_task_id").references(
    () => recurringTasks.id,
    { onDelete: "set null" }
  ),
  dueDate: text("due_date").notNull(), // stored as YYYY-MM-DD
  dueTime: text("due_time"), // optional, stored as HH:MM (24-hour)
  status: text("status", {
    enum: ["PENDING", "IN_PROGRESS", "COMPLETED"],
  })
    .notNull()
    .default("PENDING"),
  priority: text("priority", { enum: ["LOW", "MEDIUM", "HIGH"] })
    .notNull()
    .default("MEDIUM"),
  assignEmailSentAt: text("assign_email_sent_at"),
  reminderEmailSentAt: text("reminder_email_sent_at"),
  completedAt: text("completed_at"),
  // Short random token embedded in the assignment email's subject line
  // (e.g. "[REF-AB12CD]"). When the assignee hits Reply, most mail clients
  // preserve it in "Re: ..." — the check-replies cron job uses it to match
  // an inbound reply back to this exact task.
  replyToken: text("reply_token"),
  repliedAt: text("replied_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  tasks: many(tasks),
  recurringTasks: many(recurringTasks),
}));

export const recurringTasksRelations = relations(
  recurringTasks,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [recurringTasks.clientId],
      references: [clients.id],
    }),
    assignee: one(users, {
      fields: [recurringTasks.assigneeId],
      references: [users.id],
    }),
    instances: many(tasks),
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  recurringTask: one(recurringTasks, {
    fields: [tasks.recurringTaskId],
    references: [recurringTasks.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type RecurringTask = typeof recurringTasks.$inferSelect;
export type NewRecurringTask = typeof recurringTasks.$inferInsert;
