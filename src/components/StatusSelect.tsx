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
}: {
  taskId: number;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
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
  );
}
