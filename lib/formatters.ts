const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatIndianCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatVenueDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function formatVenueTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatVenueRange(startsAt: string, endsAt: string) {
  return `${formatVenueTime(startsAt)} to ${formatVenueTime(endsAt)}`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
