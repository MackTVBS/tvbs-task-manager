/**
 * Returns YYYY-MM-DD for "today" in the configured business timezone
 * (defaults to Asia/Kolkata, since TVBS's team is based in India).
 */
export function todayInTz(daysOffset = 0): string {
  const tz = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const now = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now); // en-CA gives YYYY-MM-DD
}

const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/**
 * Returns today's 3-letter day code (MON..SUN) in the configured business
 * timezone.
 */
export function todayDayCodeInTz(daysOffset = 0): string {
  const tz = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const now = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
  }).format(now); // e.g. "Mon", "Tue"
  const idx = DAY_CODES.findIndex(
    (d) => d.toLowerCase() === weekday.slice(0, 3).toLowerCase()
  );
  return idx >= 0 ? DAY_CODES[idx] : DAY_CODES[now.getUTCDay()];
}

// Asia/Kolkata has a fixed UTC+5:30 offset (no DST), so it's safe to treat
// this as a constant rather than resolving it dynamically.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * SQLite's `(current_timestamp)` default stores UTC time as
 * "YYYY-MM-DD HH:MM:SS" with no timezone marker. Parse it as UTC.
 */
function parseSqliteUtcTimestamp(ts: string): Date {
  const iso = ts.includes("T") ? ts : ts.replace(" ", "T");
  return new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
}

/**
 * Converts a "YYYY-MM-DD" + "HH:MM" pair, understood as Asia/Kolkata local
 * time, into the absolute instant (UTC) it refers to.
 */
function dueInstantFromIST(dueDate: string, dueTime: string): Date | null {
  const [y, m, d] = dueDate.split("-").map(Number);
  const [hh, mm] = dueTime.split(":").map(Number);
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
  const utcMillis =
    Date.UTC(y, m - 1, d, hh, mm, 0) - IST_OFFSET_MINUTES * 60 * 1000;
  return new Date(utcMillis);
}

/**
 * For an in-progress task with a due date + time, returns how much of the
 * window between when it was created and its deadline has elapsed, as a
 * whole-number percentage clamped to 0-100. Returns null when there's no
 * due time to anchor to (nothing to show).
 */
export function timeProgressPercent(
  createdAt: string,
  dueDate: string,
  dueTime: string | null | undefined
): number | null {
  if (!dueTime) return null;

  const due = dueInstantFromIST(dueDate, dueTime);
  if (!due) return null;

  const start = parseSqliteUtcTimestamp(createdAt).getTime();
  const dueMs = due.getTime();
  if (!Number.isFinite(start) || dueMs <= start) return null;

  const pct = ((Date.now() - start) / (dueMs - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
