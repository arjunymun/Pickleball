import { describe, expect, it } from "vitest";

import {
  adminBlockSchema,
  bookSlotSchema,
  checkoutSchema,
  readJsonBody,
  walletCreditSchema,
} from "../lib/validation";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("request body schemas", () => {
  it("accepts a valid wallet credit and rejects missing / invalid fields", () => {
    expect(walletCreditSchema.safeParse({ customerId: "c1", amountInr: 500, note: "Promo" }).success).toBe(true);
    expect(walletCreditSchema.safeParse({ customerId: "c1", note: "Promo" }).success).toBe(false);
    expect(walletCreditSchema.safeParse({ customerId: "c1", amountInr: -5, note: "x" }).success).toBe(false);
    expect(walletCreditSchema.safeParse({ customerId: "", amountInr: 5, note: "x" }).success).toBe(false);
  });

  it("coerces a numeric-string amount to a number", () => {
    const result = walletCreditSchema.safeParse({ customerId: "c1", amountInr: "500", note: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountInr).toBe(500);
    }
  });

  it("restricts checkout kind to the known enum", () => {
    expect(checkoutSchema.safeParse({ kind: "pack", resourceId: "p1" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ kind: "subscription", resourceId: "p1" }).success).toBe(false);
  });

  it("rejects an admin block with an invalid date", () => {
    expect(
      adminBlockSchema.safeParse({
        venueId: "v",
        courtId: "c",
        startsAt: "2026-05-09T06:00:00Z",
        endsAt: "2026-05-09T07:00:00Z",
      }).success,
    ).toBe(true);
    expect(
      adminBlockSchema.safeParse({ venueId: "v", courtId: "c", startsAt: "not-a-date", endsAt: "2026-05-09T07:00:00Z" })
        .success,
    ).toBe(false);
  });

  it("requires a non-empty slotId", () => {
    expect(bookSlotSchema.safeParse({ slotId: "slot-1" }).success).toBe(true);
    expect(bookSlotSchema.safeParse({}).success).toBe(false);
  });
});

describe("readJsonBody", () => {
  it("returns parsed data for a valid body", async () => {
    const result = await readJsonBody(jsonRequest({ slotId: "slot-1" }), bookSlotSchema);
    expect(result.error).toBeUndefined();
    expect(result.data?.slotId).toBe("slot-1");
  });

  it("returns a 400 NextResponse for a schema violation", async () => {
    const result = await readJsonBody(jsonRequest({ slotId: "" }), bookSlotSchema);
    expect(result.data).toBeUndefined();
    expect(result.error?.status).toBe(400);
  });

  it("returns a 400 for malformed JSON instead of throwing", async () => {
    const badRequest = new Request("http://localhost/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ not valid json",
    });
    const result = await readJsonBody(badRequest, bookSlotSchema);
    expect(result.error?.status).toBe(400);
  });
});
