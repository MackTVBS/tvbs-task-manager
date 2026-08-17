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
