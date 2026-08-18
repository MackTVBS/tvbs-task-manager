import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import {
  listRecurringTasks,
  listClients,
  listUsers,
} from "@/lib/db/queries";
import {
  toggleRecurringTaskAction,
  deleteRecurringTaskAction,
} from "@/lib/recurring/actions";
import RecurringTaskForm from "@/components/RecurringTaskForm";
import PriorityBadge from "@/components/PriorityBadge";

const DAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

function formatDays(daysOfWeek: string) {
  const days = daysOfWeek.split(",").filter(Boolean);
  if (days.length === 7) return "Every day";
  return days.map((d) => DAY_LABELS[d] || d).join(", ");
}

export default async function RecurringTasksPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  const [recurring, clients, members] = await Promise.all([
    listRecurringTasks(),
    listClients(),
    listUsers(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">
        Recurring tasks
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Each active task below is automatically created and emailed to its
        assignee every morning at 9:00 AM IST, on the days you choose.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {recurring.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center text-sm text-slate-500">
              No recurring tasks yet.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
              {recurring.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {r.title}
                        </p>
                        <PriorityBadge priority={r.priority} />
                        {!r.active && (
                          <span className="text-xs font-medium bg-slate-100 text-slate-500 rounded-full px-2 py-1">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {r.clientName} · assigned to {r.assigneeName} ·{" "}
                        {formatDays(r.daysOfWeek)}
                        {r.dueTime ? ` · due ${r.dueTime} IST daily` : ""}
                      </p>
                      {r.description && (
                        <p className="text-sm text-slate-500 mt-1">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <form action={toggleRecurringTaskAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="nextActive"
                          value={(!r.active).toString()}
                        />
                        <button
                          type="submit"
                          className="text-xs text-slate-600 hover:underline"
                        >
                          {r.active ? "Pause" : "Resume"}
                        </button>
                      </form>
                      <form action={deleteRecurringTaskAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <RecurringTaskForm clients={clients} members={members} />
        </div>
      </div>
    </div>
  );
}
