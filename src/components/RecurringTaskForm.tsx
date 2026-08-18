"use client";

import { useActionState } from "react";
import {
  createRecurringTaskAction,
  type FormState,
} from "@/lib/recurring/actions";

type Option = { id: number; name: string };

const DAYS: { code: string; label: string }[] = [
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
  { code: "SAT", label: "Sat" },
  { code: "SUN", label: "Sun" },
];

export default function RecurringTaskForm({
  clients,
  members,
}: {
  clients: Option[];
  members: Option[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createRecurringTaskAction,
    null
  );

  return (
    <form
      action={formAction}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Task title
        </label>
        <input
          type="text"
          name="title"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          placeholder="e.g. Daily social media posting"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          placeholder="Details to include in every day's email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Client
          </label>
          <select
            name="clientId"
            required
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Assign to
          </label>
          <select
            name="assigneeId"
            required
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="">Select a team member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Daily deadline{" "}
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="time"
            name="dueTime"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
          <p className="text-xs text-slate-500 mt-1">
            If set, each day's task shows a "time remaining" % while In
            progress.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Repeats on
        </label>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((d) => (
            <label
              key={d.code}
              className="flex items-center gap-1.5 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name={`day_${d.code}`}
                defaultChecked
                className="rounded border-slate-300"
              />
              {d.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Each morning at 9:00 AM IST, this task is created fresh for the
          day and the assignee is emailed immediately.
        </p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Create recurring task"}
      </button>
    </form>
  );
}
