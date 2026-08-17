import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getTaskById, listClients, listUsers } from "@/lib/db/queries";
import StatusSelect from "@/components/StatusSelect";
import PriorityBadge from "@/components/PriorityBadge";
import TaskForm from "@/components/TaskForm";
import { updateTaskAction, deleteTaskAction } from "@/lib/tasks/actions";

export default async function TaskDetailPage(
  props: PageProps<"/tasks/[id]">
) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { id } = await props.params;
  const taskId = Number(id);
  if (!taskId) notFound();

  const task = await getTaskById(taskId);
  if (!task) notFound();

  const canManage = user.role === "ADMIN";
  const canUpdateStatus = canManage || task.assigneeId === user.id;

  if (canManage) {
    const [clients, members] = await Promise.all([
      listClients(),
      listUsers(),
    ]);

    return (
      <div className="max-w-lg">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Back to tasks
        </Link>
        <h1 className="text-xl font-semibold text-slate-900 mt-2 mb-1">
          Edit task
        </h1>
        <div className="flex items-center gap-2 mb-6">
          <PriorityBadge priority={task.priority} />
          <span className="text-xs text-slate-500">
            Status: {task.status.replace("_", " ")}
          </span>
        </div>

        <TaskForm
          action={updateTaskAction}
          clients={clients}
          members={members}
          submitLabel="Save changes"
          defaultValues={{
            taskId: task.id,
            title: task.title,
            description: task.description || "",
            clientId: task.clientId,
            assigneeId: task.assigneeId || undefined,
            dueDate: task.dueDate,
            priority: task.priority,
          }}
        />

        <div className="mt-6 flex items-center justify-between">
          <StatusSelect taskId={task.id} status={task.status} />
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Delete task
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Back to tasks
      </Link>
      <div className="bg-white border border-slate-200 rounded-lg p-6 mt-4">
        <div className="flex items-center gap-2 mb-2">
          <PriorityBadge priority={task.priority} />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          {task.title}
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          For {task.clientName} · Due {task.dueDate}
        </p>
        {task.description && (
          <p className="text-sm text-slate-700 whitespace-pre-wrap mb-6">
            {task.description}
          </p>
        )}

        {canUpdateStatus ? (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <StatusSelect taskId={task.id} status={task.status} />
          </div>
        ) : (
          <span className="text-xs text-slate-500">
            Status: {task.status.replace("_", " ")}
          </span>
        )}
      </div>
    </div>
  );
}
