import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listTasks } from "@/lib/db/queries";
import StatusSelect from "@/components/StatusSelect";
import PriorityBadge from "@/components/PriorityBadge";
import { todayInTz } from "@/lib/date";
import { redirect } from "next/navigation";

function dueBadge(dueDate: string, status: string, today: string) {
  if (status === "COMPLETED") return null;
  if (dueDate < today)
    return <span className="text-xs font-medium text-red-600">Overdue</span>;
  if (dueDate === today)
    return (
      <span className="text-xs font-medium text-amber-600">Due today</span>
    );
  return null;
}

export default async function DashboardPage(
  props: PageProps<"/dashboard">
) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const scopeParam = Array.isArray(searchParams.scope)
    ? searchParams.scope[0]
    : searchParams.scope;
  const statusParam = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  const defaultScope = user.role === "ADMIN" ? "all" : "mine";
  const scope = scopeParam || defaultScope;
  const statusFilter = statusParam || "OPEN";

  const allTasks = await listTasks();
  const today = todayInTz(0);

  let tasks = allTasks;
  if (scope === "mine") {
    tasks = tasks.filter((t) => t.assigneeId === user.id);
  }
  if (statusFilter === "OPEN") {
    tasks = tasks.filter((t) => t.status !== "COMPLETED");
  } else if (statusFilter !== "ALL") {
    tasks = tasks.filter((t) => t.status === statusFilter);
  }

  // Sort: overdue/due-soonest first, already handled by dueDate asc from query.

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium ${
      active
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-100"
    }`;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500">
            {scope === "mine" ? "Your tasks" : "All client tasks"}
          </p>
        </div>
        {user.role === "ADMIN" && (
          <Link
            href="/tasks/new"
            className="bg-slate-900 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-slate-800"
          >
            + New task
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Link
          href={`/dashboard?scope=mine&status=${statusFilter}`}
          className={tabClass(scope === "mine")}
        >
          My tasks
        </Link>
        <Link
          href={`/dashboard?scope=all&status=${statusFilter}`}
          className={tabClass(scope === "all")}
        >
          All tasks
        </Link>
        <span className="w-px h-5 bg-slate-300 mx-1" />
        <Link
          href={`/dashboard?scope=${scope}&status=OPEN`}
          className={tabClass(statusFilter === "OPEN")}
        >
          Open
        </Link>
        <Link
          href={`/dashboard?scope=${scope}&status=COMPLETED`}
          className={tabClass(statusFilter === "COMPLETED")}
        >
          Completed
        </Link>
        <Link
          href={`/dashboard?scope=${scope}&status=ALL`}
          className={tabClass(statusFilter === "ALL")}
        >
          All
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-500">
          No tasks here.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3">Task</th>
                <th className="text-left font-medium px-4 py-3">Client</th>
                <th className="text-left font-medium px-4 py-3">Assignee</th>
                <th className="text-left font-medium px-4 py-3">Due</th>
                <th className="text-left font-medium px-4 py-3">Priority</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.clientName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {task.assigneeName || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>{task.dueDate}</span>
                      {dueBadge(task.dueDate, task.status, today)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {user.role === "ADMIN" || task.assigneeId === user.id ? (
                      <StatusSelect taskId={task.id} status={task.status} />
                    ) : (
                      <span className="text-xs text-slate-500">
                        {task.status.replace("_", " ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
