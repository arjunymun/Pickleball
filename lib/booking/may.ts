const INDIA_TIMEZONE = "Asia/Kolkata";
const MAY_2026_ANCHOR = "2026-05-08T09:00:00+05:30";

export function getMayAnchorDate() {
  return new Date(MAY_2026_ANCHOR);
}

export function getMayRelativeIso(dayOffset: number, time: string) {
  const anchor = getMayAnchorDate();
  const probe = new Date(anchor.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(probe);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not derive May 2026 venue date.");
  }

  return new Date(`${year}-${month}-${day}T${time}:00+05:30`).toISOString();
}

export function getMayCalendarDate(dayOffset = 0) {
  return getMayRelativeIso(dayOffset, "09:00").slice(0, 10);
}
