import { describe, expect, it } from "vitest";
import { safeReturnPath } from "@/lib/academy/auth-path";
import {
  academyBody,
  requireSameOrigin,
  retiredRoute,
} from "@/lib/academy/http";
import { holdInput, staffBookingInput } from "@/lib/academy/schema";
import { translateDatabaseError } from "@/lib/academy/errors";

describe("academy request boundaries", () => {
  it.each([
    "https://evil.invalid",
    "//evil.invalid",
    "/\\evil.invalid",
    "/%2f%2fevil.invalid",
    "/app%0d%0aLocation:evil",
    "/api/runtime/bootstrap",
    "/sign-in",
  ])("rejects unsafe auth return %s", (input) => {
    expect(safeReturnPath(input)).toBe("/app/bookings");
  });
  it("preserves the selected court and safe membership/admin return path", () => {
    expect(
      safeReturnPath("/book?courtId=one&startsAt=2026-10-03T10%3A30%3A00Z"),
    ).toBe("/book?courtId=one&startsAt=2026-10-03T10%3A30%3A00Z");
    expect(safeReturnPath("/membership")).toBe("/membership");
    expect(safeReturnPath("/admin/schedule")).toBe("/admin/schedule");
  });
  it("rejects cross-origin staff mutations", () => {
    expect(() =>
      requireSameOrigin(
        new Request("https://academy.invalid/api/admin/bookings", {
          headers: { origin: "https://evil.invalid" },
        }),
      ),
    ).toThrow();
    expect(() =>
      requireSameOrigin(
        new Request("https://academy.invalid/api/admin/bookings", {
          headers: { origin: "https://academy.invalid" },
        }),
      ),
    ).not.toThrow();
  });
  it("rejects malformed JSON and customer-supplied price/status/duration", async () => {
    await expect(
      academyBody(
        new Request("https://academy.invalid/api/bookings/holds", {
          method: "POST",
          body: "{",
        }),
        holdInput,
      ),
    ).rejects.toThrow();
    const valid = {
      courtId: "6b6fe5c1-e41f-49f3-a234-e5f431df3e25",
      startsAt: "2026-10-03T10:30:00Z",
      idempotencyKey: "hold-key-one",
    };
    expect(holdInput.safeParse(valid).success).toBe(true);
    expect(
      holdInput.safeParse({
        ...valid,
        amountPaise: 1,
        status: "confirmed",
        holdMinutes: 240,
      }).success,
    ).toBe(false);
    expect(
      staffBookingInput.safeParse({
        ...valid,
        source: "phone",
        customerName: "Test player",
        amountPaise: 0.5,
      }).success,
    ).toBe(false);
  });
  it("does not expose SQL messages or secrets in API error translation", () => {
    const error = translateDatabaseError({
      code: "42P01",
      message: "private table secret_connection_url missing",
    });
    expect(error.status).toBe(503);
    expect(error.message).not.toContain("secret");
    expect(
      translateDatabaseError({ code: "23P01", message: "raw exclusion detail" })
        .status,
    ).toBe(409);
  });
  it("explicitly retires legacy mutation APIs", async () => {
    const response = retiredRoute();
    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({
      code: "LEGACY_ENDPOINT_RETIRED",
    });
  });
});
