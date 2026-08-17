export default function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700",
    MEDIUM: "bg-blue-100 text-blue-700",
    LOW: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`text-xs font-medium rounded-full px-2 py-1 ${
        styles[priority] || styles.MEDIUM
      }`}
    >
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}
