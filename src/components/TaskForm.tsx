"use client";

import { useActionState } from "react";

type Option = { id: number; name: string };

export default function TaskForm({
  action,
  clients,
  members,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: any, formData: FormData) => Promise<any>;
  clients: Option[];
  members: Option[];
  defaultValues?: {
    taskId?: number;
    title?: string;
    description?: string;
    clientId?: number;
    assigneeId?: number;
    dueDate?: string;
    priority?: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form
      action={formAction}
      className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
    >
      {defaultValues?.taskId && (
        <input type="hidden" name="taskId" value={defaultValues.taskId} />
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Task title
        </label>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          placeholder="e.g. Prepare Q3 media plan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          placeholder="Any details the assignee needs"
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
            defaultValue={defaultValues?.clientId}
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
            defaultValue={defaultValues?.assigneeId}
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
            Due date
          </label>
          <input
            type="date"
            name="dueDate"
            required
            defaultValue={defaultValues?.dueDate}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Priority
          </label>
          <select
            name="priority"
            defaultValue={defaultValues?.priority || "MEDIUM"}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
