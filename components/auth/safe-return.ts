export function safeReturnPath(value: unknown, fallback = "/app"): string {
  if (
    typeof value !== "string" ||
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  )
    return fallback;
  try {
    const url = new URL(value, "https://academy.invalid");
    if (url.origin !== "https://academy.invalid") return fallback;
    if (!/^\/(?:book|app|membership|admin)(?:\/|$)/.test(url.pathname))
      return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
