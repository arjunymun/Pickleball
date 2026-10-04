export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/app/bookings",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n\u0000]/.test(value)
  )
    return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\r\n\u0000]/.test(decoded))
      return fallback;
    const url = new URL(value, "https://academy.invalid");
    if (
      url.origin !== "https://academy.invalid" ||
      !["/app", "/admin", "/book", "/membership"].some(
        (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
      )
    )
      return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
