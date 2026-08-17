import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { listClients, listUsers } from "@/lib/db/queries";
import { createTaskAction } from "@/lib/tasks/actions";
import TaskForm from "@/components/TaskForm";
import Link from "next/link";

export default async function NewTaskPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const [clients, users] = await Promise.all([listClients(), listUsers()]);

  if (clients.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-2">New task</h1>
        <p className="text-sm text-slate-600">
          You need at least one client before you can create a task.{" "}
          <Link href="/clients" className="underline">
            Add a client first
          </Link>
          .
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold mb-2">New task</h1>
        <p className="text-sm text-slate-600">
          You need at least one team member before you can create a task.{" "}
          <Link href="/team" className="underline">
            Add a team member first
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">New task</h1>
      <p className="text-sm text-slate-500 mb-6">
        The assignee will get an email immediately with the task details.
      </p>
      <TaskForm
        action={createTaskAction}
        clients={clients}
        members={users}
        submitLabel="Create task & notify"
      />
    </div>
  );
}
