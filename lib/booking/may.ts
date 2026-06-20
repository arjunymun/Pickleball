const INDIA_TIMEZONE = "Asia/Kolkata";

// The seed expresses every slot, booking, and offer as a day-offset from this anchor
// (e.g. +1 day = "tomorrow at sunrise", -2 days = "a recent completed booking"). A fixed
// calendar anchor goes stale: once the real date passes it, every "future" slot becomes a
// past slot and the availability engine marks the whole board "expired" — which is exactly
// the empty "No slot / 0 court windows" demo failure. Anchoring to the current day in the
// venue timezone keeps the relative scenario perpetually fresh wherever/whenever it renders.
function getVenueTodayAnchor() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not derive the venue anchor date.");
  }

  return new Date(`${year}-${month}-${day}T09:00:00+05:30`);
}

export function getMayAnchorDate() {
  return getVenueTodayAnchor();
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
