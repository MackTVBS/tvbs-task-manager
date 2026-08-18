"use client";

import { useTransition } from "react";
import { updateTaskStatusAction } from "@/lib/tasks/actions";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
];

export default function StatusSelect({
  taskId,
  status,
  progressPercent,
}: {
  taskId: number;
  status: string;
  /**
   * For In progress tasks with a due date + time: % of the time between
   * when the task was created and its deadline that has already elapsed.
   * Pass null/undefined when there's no deadline to measure against.
   */
  progressPercent?: number | null;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const formData = new FormData();
          formData.set("taskId", String(taskId));
          formData.set("status", e.target.value);
          startTransition(() => {
            updateTaskStatusAction(formData);
          });
        }}
        className={`text-xs font-medium rounded-full border-0 py-1 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-slate-800 ${
          status === "COMPLETED"
            ? "bg-green-100 text-green-800"
            : status === "IN_PROGRESS"
            ? "bg-amber-100 text-amber-800"
            : "bg-slate-200 text-slate-700"
        } ${isPending ? "opacity-60" : ""}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {status === "IN_PROGRESS" &&
        progressPercent !== null &&
        progressPercent !== undefined && (
          <span
            title="Share of the time until the deadline that has elapsed"
            className={`text-xs font-semibold ${
              progressPercent >= 90
                ? "text-red-600"
                : progressPercent >= 60
                ? "text-amber-600"
                : "text-slate-500"
            }`}
          >
            {progressPercent}%
          </span>
        )}
    </div>
  );
}
