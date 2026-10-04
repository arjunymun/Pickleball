import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safe-return";

describe("customer sign-in return path", () => {
  it("preserves the selected court and booking intent", () => {
    const intent = "/book?date=2026-10-08&time=19&court=court-2";
    expect(safeReturnPath(intent)).toBe(intent);
    expect(safeReturnPath("/book/review?booking=reservation-id")).toBe(
      "/book/review?booking=reservation-id",
    );
    expect(safeReturnPath("/membership")).toBe("/membership");
    expect(safeReturnPath("/admin/schedule?date=2026-10-08")).toBe(
      "/admin/schedule?date=2026-10-08",
    );
  });
  it.each([
    undefined,
    null,
    ["/book", "/admin"],
    123,
    "",
    "https://malicious.example/book",
    "//malicious.example/book",
    "/\\malicious.example",
    "/book\nmalicious",
    "javascript:alert(1)",
    "/api/runtime/bootstrap",
    "/demo/operator",
    "/book/../../auth/portfolio",
    "/%2f%2fmalicious.example",
  ])("rejects unsafe or unrelated destination %s", (value) => {
    expect(safeReturnPath(value)).toBe("/app");
  });
});
