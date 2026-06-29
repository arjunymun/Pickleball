import { describe, expect, it } from "vitest";

import { bookableSlots, offers } from "../lib/mock-data";
import {
  approveBooking,
  bookSlot,
  cancelBooking,
  confirmBookingCheckout,
  createSeedDemoState,
  getAdminDashboard,
  getBlockingBookingForSlot,
  getUpcomingBookingsForCustomer,
  getWalletBalance,
} from "../lib/demo-state";
import type { DemoState } from "../lib/demo-state";

// Synthetic customer ids with no seeded wallet ledger, so their balance is whatever the test
// explicitly grants. Keeps the lifecycle assertions independent of the seed's preview customer.
const EMPTY_WALLET_CUSTOMER = "test-customer-empty";
const FUNDED_CUSTOMER = "test-customer-funded";

type Slot = (typeof bookableSlots)[number];

// Pick the first seed slot matching `predicate` that is not already blocked by a live booking,
// computed from the actual seed rather than a hardcoded id so the tests survive seed reshuffles.
function firstOpenSlot(state: DemoState, predicate: (slot: Slot) => boolean): Slot | undefined {
  return bookableSlots.find((slot) => predicate(slot) && !getBlockingBookingForSlot(state, slot.id));
}

function withWalletCredit(state: DemoState, customerId: string, amountInr: number): DemoState {
  return {
    ...state,
    walletLedgerEntries: [
      ...state.walletLedgerEntries,
      {
        id: `test-credit-${customerId}`,
        customerId,
        createdAt: new Date("2026-01-01T00:00:00+05:30").toISOString(),
        amountInr,
        kind: "credit_added",
        note: "Test seed credit",
      },
    ],
  };
}

describe("demo booking lifecycle", () => {
  it("routes an instant online slot a zero-balance customer cannot cover into payment_pending", () => {
    const state = createSeedDemoState();
    const slot = firstOpenSlot(state, (s) => s.confirmationMode === "instant" && s.paymentMode === "online");
    expect(slot, "seed should expose an open instant online slot").toBeDefined();

    const { nextState } = bookSlot(state, slot!.id, EMPTY_WALLET_CUSTOMER);
    const created = nextState.bookings.at(-1)!;

    expect(created.status).toBe("payment_pending");
    expect(created.paymentStatus).toBe("pending");
    expect(created.confirmedAt).toBeNull();
    // The wallet could not cover it, so nothing was spent.
    expect(getWalletBalance(nextState, EMPTY_WALLET_CUSTOMER)).toBe(0);
  });

  it("promotes a payment_pending booking to confirmed / paid_online on checkout", () => {
    const state = createSeedDemoState();
    const slot = firstOpenSlot(state, (s) => s.confirmationMode === "instant" && s.paymentMode === "online");
    expect(slot).toBeDefined();

    const held = bookSlot(state, slot!.id, EMPTY_WALLET_CUSTOMER).nextState;
    const pending = held.bookings.at(-1)!;
    expect(pending.status).toBe("payment_pending");

    const { nextState } = confirmBookingCheckout(held, pending.id);
    const confirmed = nextState.bookings.find((b) => b.id === pending.id)!;

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.paymentStatus).toBe("paid_online");
    expect(confirmed.confirmedAt).not.toBeNull();
  });

  it("confirms immediately and spends wallet credit when the balance covers the slot", () => {
    const slot = firstOpenSlot(createSeedDemoState(), (s) => s.confirmationMode === "instant" && s.paymentMode === "online");
    expect(slot).toBeDefined();

    const state = withWalletCredit(createSeedDemoState(), FUNDED_CUSTOMER, 100_000);
    const startingBalance = getWalletBalance(state, FUNDED_CUSTOMER);

    const { nextState } = bookSlot(state, slot!.id, FUNDED_CUSTOMER);
    const created = nextState.bookings.at(-1)!;

    expect(created.status).toBe("confirmed");
    expect(created.paymentStatus).toBe("credit_applied");
    expect(getWalletBalance(nextState, FUNDED_CUSTOMER)).toBe(startingBalance - created.totalAmountInr);
  });

  it("sends a review-confirmation slot into the operator queue as requested", () => {
    const state = createSeedDemoState();
    const slot = firstOpenSlot(state, (s) => s.confirmationMode === "review");
    expect(slot, "seed should expose an open review slot").toBeDefined();

    const { nextState } = bookSlot(state, slot!.id, EMPTY_WALLET_CUSTOMER);
    const created = nextState.bookings.at(-1)!;

    expect(created.status).toBe("requested");
    // pay_at_venue takes precedence over status; an online review slot would be "pending".
    expect(created.paymentStatus).toBe(slot!.paymentMode === "pay_at_venue" ? "pay_at_venue" : "pending");
  });

  it("refuses to double-book a slot that already has a live booking", () => {
    const state = createSeedDemoState();
    const blockedSlotId = state.bookings.find((b) =>
      ["held", "payment_pending", "requested", "confirmed"].includes(b.status),
    )?.slotId;
    expect(blockedSlotId, "seed should contain at least one live booking").toBeDefined();

    expect(() => bookSlot(state, blockedSlotId!, EMPTY_WALLET_CUSTOMER)).toThrow(/unavailable/i);
  });

  it("returns the booking value as refund credit when a credit-applied booking is canceled", () => {
    const slot = firstOpenSlot(createSeedDemoState(), (s) => s.confirmationMode === "instant" && s.paymentMode === "online");
    expect(slot).toBeDefined();

    const state = withWalletCredit(createSeedDemoState(), FUNDED_CUSTOMER, 100_000);
    const booked = bookSlot(state, slot!.id, FUNDED_CUSTOMER).nextState;
    const created = booked.bookings.at(-1)!;
    expect(created.paymentStatus).toBe("credit_applied");

    const balanceAfterBooking = getWalletBalance(booked, FUNDED_CUSTOMER);
    const { nextState } = cancelBooking(booked, created.id, "Customer");
    const canceled = nextState.bookings.find((b) => b.id === created.id)!;

    expect(canceled.status).toBe("canceled");
    expect(canceled.canceledAt).not.toBeNull();
    // The slot value is returned to the wallet as refund credit.
    expect(getWalletBalance(nextState, FUNDED_CUSTOMER)).toBe(balanceAfterBooking + slot!.priceInr);
  });

  it("releases the offer redemption when an offer booking is canceled", () => {
    const seed = createSeedDemoState();
    const slot = firstOpenSlot(seed, (s) => s.confirmationMode === "instant" && s.paymentMode === "online");
    expect(slot).toBeDefined();
    const offer = offers.find(
      (o) => o.status === "active" && seed.offerRedemptions.filter((r) => r.offerId === o.id).length < o.redemptionCap,
    );
    expect(offer, "seed should expose a redeemable active offer").toBeDefined();

    const state = withWalletCredit(seed, FUNDED_CUSTOMER, 100_000);
    const baseline = state.offerRedemptions.filter((r) => r.offerId === offer!.id).length;

    const booked = bookSlot(state, slot!.id, FUNDED_CUSTOMER, { offerId: offer!.id }).nextState;
    const created = booked.bookings.at(-1)!;
    expect(booked.offerRedemptions.filter((r) => r.offerId === offer!.id).length).toBe(baseline + 1);

    const { nextState } = cancelBooking(booked, created.id, "Customer");
    // Canceling releases the redemption so it no longer counts against the offer cap.
    expect(nextState.offerRedemptions.filter((r) => r.offerId === offer!.id).length).toBe(baseline);
  });

  it("does not crash on bookings that reference a missing slot (corrupted demo state)", () => {
    const state = createSeedDemoState();
    const orphan = {
      ...state.bookings[0],
      id: "booking-orphan",
      slotId: "slot-does-not-exist",
      status: "requested" as const,
    };
    const corrupted = { ...state, bookings: [...state.bookings, orphan] };

    // Read/sort paths skip the orphan instead of throwing on undefined.slot.
    expect(() => getAdminDashboard(corrupted)).not.toThrow();
    expect(() => getUpcomingBookingsForCustomer(corrupted, orphan.customerId)).not.toThrow();
    // approveBooking surfaces a clear error rather than a TypeError on slot.label.
    expect(() => approveBooking(corrupted, "booking-orphan")).toThrow(/no longer exists/i);
  });

  it("treats a checked-in booking as blocking its slot", () => {
    const state = createSeedDemoState();
    const slot = firstOpenSlot(state, () => true);
    expect(slot).toBeDefined();
    const withCheckedIn = {
      ...state,
      bookings: [
        ...state.bookings,
        { ...state.bookings[0], id: "booking-checkedin", slotId: slot!.id, status: "checked_in" as const },
      ],
    };
    expect(getBlockingBookingForSlot(withCheckedIn, slot!.id)?.id).toBe("booking-checkedin");
  });
});
