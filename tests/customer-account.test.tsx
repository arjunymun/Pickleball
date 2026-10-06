import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { CustomerAccountPayload } from "@/lib/academy/contracts";
import { CustomerAccount } from "@/components/customer/customer-account";

const mocks = vi.hoisted(() => ({ payload: null as unknown }));

vi.mock("@/components/customer/customer-data", () => ({
  useCustomerData: () => ({
    data: mocks.payload,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => null,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/app" }));

beforeEach(() => {
  mocks.payload = {
    user: {
      id: "customer-1",
      email: "player@example.com",
      name: "Player One",
      role: "customer",
    },
    bookings: [
      {
        id: "booking-1",
        courtId: "court-1",
        courtName: "Court 1",
        customerId: "customer-1",
        customerName: "Player One",
        startsAt: "2026-10-07T12:30:00.000Z",
        endsAt: "2026-10-07T13:30:00.000Z",
        status: "held",
        paymentStatus: "pending",
        amountPaise: 50_000,
        refundedPaise: 0,
        holdExpiresAt: "2026-10-07T12:40:00.000Z",
        source: "online",
        reference: null,
        reason: null,
        createdAt: "2026-10-06T12:00:00.000Z",
      },
    ],
    membership: null,
    attendance: [],
    paymentMode: "unconfigured",
  } satisfies CustomerAccountPayload;
});

it("labels an unconfigured payment hold as a review instead of checkout", () => {
  const html = renderToStaticMarkup(React.createElement(CustomerAccount));

  expect(html).toContain("Review booking hold");
  expect(html).not.toContain("Continue to payment");
  expect(html).toContain("IST");
});
