import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { AcademyPayments, type PaymentAttempt } from "@/lib/academy/payments";
import { AcademyError } from "@/lib/academy/errors";
import {
  assertCapturedPayment,
  razorpayGateway,
  signatureMatches,
  type AcademyGateway,
  type GatewayPayment,
} from "@/lib/academy/gateway";
import type { AcademyRepository } from "@/lib/academy/repository";

const attempt: PaymentAttempt = {
  id: "c931a6a9-a073-4e45-9066-9cd6b3921cc8",
  booking_id: "7c0e3c78-5b0f-4b4e-a72b-85c4faeebc61",
  membership_id: null,
  actor_id: "customer-a",
  provider_id: "order_A",
  amount_paise: 50000,
  status: "ready",
  create: false,
};
const payment: GatewayPayment = {
  id: "pay_A",
  order_id: "order_A",
  invoice_id: null,
  amount: 50000,
  currency: "INR",
  status: "captured",
  amount_refunded: 0,
  created_at: 1780500000,
};
const config = {
  keyId: "rzp_test_fixture",
  secret: "fixture-secret",
  webhookSecrets: ["fixture-webhook"],
  planId: "plan_fixture",
  mode: "test" as const,
};
const sign = (message: string, secret = config.secret) =>
  createHmac("sha256", secret).update(message).digest("hex");
function repository(
  handler: (
    action: string,
    input?: Record<string, unknown>,
    actor?: string | null,
  ) => unknown = () => null,
) {
  const calls = vi.fn(handler);
  const repo: AcademyRepository = {
    async dispatch<T>(action: string, input = {}, actor = null): Promise<T> {
      return (await calls(action, input, actor)) as T;
    },
  };
  return { repo, calls };
}
function gateway(overrides: Partial<AcademyGateway> = {}): AcademyGateway {
  return {
    config,
    createOrder: vi.fn(async () => ({
      id: "order_A",
      amount: 50000,
      currency: "INR",
      status: "created",
      receipt: attempt.id,
    })),
    getOrder: vi.fn(async () => ({
      id: "order_A",
      amount: 50000,
      currency: "INR",
      status: "paid",
    })),
    getPayment: vi.fn(async () => payment),
    orderPayments: vi.fn(async () => []),
    findAttempt: vi.fn(async () => null),
    createSubscription: vi.fn(async () => ({
      id: "sub_A",
      plan_id: config.planId,
      status: "created",
      current_start: null,
      current_end: null,
      created_at: 1780500000,
    })),
    getSubscription: vi.fn(async () => ({
      id: "sub_A",
      plan_id: config.planId,
      status: "active",
      current_start: 1780500000,
      current_end: 1783100000,
      created_at: 1780500000,
    })),
    subscriptionInvoices: vi.fn(async () => []),
    cancelSubscription: vi.fn(async () => ({
      id: "sub_A",
      plan_id: config.planId,
      status: "cancelled",
      current_start: null,
      current_end: null,
      created_at: 1780500000,
    })),
    refund: vi.fn(async () => ({
      id: "rfnd_A",
      payment_id: "pay_A",
      amount: 50000,
      status: "processed" as const,
    })),
    getRefund: vi.fn(async () => ({
      id: "rfnd_A",
      payment_id: "pay_A",
      amount: 50000,
      status: "processed" as const,
    })),
    ...overrides,
  };
}
describe("academy payment boundary", () => {
  it("does not treat an unrelated scheduled subscription change as cancellation", async () => {
    const { repo, calls } = repository((action, input) =>
      action === "cancel_membership" && !input?.providerConfirmed
        ? { id: "member-a", subscription_id: "sub_A", paid_through: new Date(Date.now() + 86400000).toISOString(), cancel_at_period_end: false }
        : { membership: { id: "member-a", cancelAtPeriodEnd: true } },
    );
    const provider = gateway({ getSubscription: vi.fn(async () => ({ id: "sub_A", plan_id: config.planId, status: "active", current_start: 1780500000, current_end: 1783100000, created_at: 1780500000, has_scheduled_changes: true })) });
    await new AcademyPayments(repo, provider).cancelMembership("customer-a");
    expect(provider.cancelSubscription).toHaveBeenCalledWith("sub_A", true);
    expect(calls).toHaveBeenCalledWith("cancel_membership", { membershipId: "member-a", providerConfirmed: true }, "customer-a");
  });
  it("preserves cancellation for reconciliation without falsely acknowledging a failed provider call", async () => {
    const { repo, calls } = repository(() => ({ id: "member-a", subscription_id: "sub_A", paid_through: null, cancel_at_period_end: false }));
    const provider = gateway({ cancelSubscription: vi.fn(async () => { throw new AcademyError("Unavailable", 503); }) });
    await expect(new AcademyPayments(repo, provider).cancelMembership("customer-a")).rejects.toThrow();
    expect(calls).toHaveBeenCalledWith("cancel_membership", {}, "customer-a");
    expect(calls.mock.calls.some(([, input]) => input?.providerConfirmed)).toBe(false);
  });
  it("checks exact HMAC, including invalid hex and wrong body", () => {
    expect(
      signatureMatches("order_A|pay_A", sign("order_A|pay_A"), config.secret),
    ).toBe(true);
    expect(
      signatureMatches("order_B|pay_A", sign("order_A|pay_A"), config.secret),
    ).toBe(false);
    expect(signatureMatches("data", "z".repeat(64), config.secret)).toBe(false);
    expect(signatureMatches("data", "a", config.secret)).toBe(false);
  });
  it.each([
    { amount: 40000 },
    { currency: "USD" },
    { order_id: "order_B" },
    { status: "authorized" },
    { status: "failed" },
    { amount_refunded: 1 },
  ])("rejects mismatched or unsettled fetched payment %j", (override) => {
    expect(() =>
      assertCapturedPayment({ ...payment, ...override }, "order_A", 50000),
    ).toThrow(AcademyError);
  });
  it("reuses the persisted provider order across repeated checkout requests", async () => {
    const { repo, calls } = repository(() => ({ ...attempt }));
    const provider = gateway();
    const service = new AcademyPayments(repo, provider);
    expect(
      (
        await service.courtCheckout(
          "customer-a",
          attempt.booking_id!,
          "checkout-key-one",
        )
      ).orderId,
    ).toBe("order_A");
    expect(
      (
        await service.courtCheckout(
          "customer-a",
          attempt.booking_id!,
          "checkout-key-two",
        )
      ).orderId,
    ).toBe("order_A");
    expect(provider.createOrder).not.toHaveBeenCalled();
    expect(calls).toHaveBeenCalledWith(
      "prepare_order",
      { bookingId: attempt.booking_id, idempotencyKey: "checkout-key-two" },
      "customer-a",
    );
  });
  it("keeps ambiguous provider creation recoverable and does not pretend success", async () => {
    const { repo, calls } = repository((action) =>
      action === "prepare_order"
        ? { ...attempt, create: true, provider_id: null }
        : { ok: true },
    );
    const service = new AcademyPayments(
      repo,
      gateway({
        createOrder: vi.fn(async () => {
          throw new AcademyError("Unavailable", 503);
        }),
      }),
    );
    await expect(
      service.courtCheckout(
        "customer-a",
        attempt.booking_id!,
        "checkout-key-one",
      ),
    ).rejects.toThrow();
    expect(calls).toHaveBeenCalledWith(
      "mark_reconcile",
      { attemptId: attempt.id },
      null,
    );
    expect(
      calls.mock.calls.some(([action]) => action === "attach_provider"),
    ).toBe(false);
  });
  it("does not return checkout if the hold expired while the provider was creating", async () => {
    let prepared = 0;
    const { repo } = repository((action) => {
      if (action === "prepare_order" && prepared++ > 0)
        throw new AcademyError("Expired", 409, "HOLD_EXPIRED");
      return { ...attempt, create: true, provider_id: null };
    });
    await expect(
      new AcademyPayments(repo, gateway()).courtCheckout(
        "customer-a",
        attempt.booking_id!,
        "checkout-key-one",
      ),
    ).rejects.toMatchObject({ code: "HOLD_EXPIRED" });
  });
  it("requires ownership mapping and fetched capture after signature validation", async () => {
    const { repo, calls } = repository((action) =>
      action === "settle_payment"
        ? { booking: { id: attempt.booking_id, status: "confirmed" } }
        : attempt,
    );
    const provider = gateway();
    await new AcademyPayments(repo, provider).verifyCourt("customer-a", {
      bookingId: attempt.booking_id!,
      razorpay_order_id: "order_A",
      razorpay_payment_id: "pay_A",
      razorpay_signature: sign("order_A|pay_A"),
    });
    expect(calls).toHaveBeenCalledWith(
      "order_mapping",
      { bookingId: attempt.booking_id },
      "customer-a",
    );
    expect(provider.getPayment).toHaveBeenCalledWith("pay_A");
    expect(calls).toHaveBeenCalledWith(
      "settle_payment",
      expect.objectContaining({ amountPaise: 50000, paymentId: "pay_A" }),
      null,
    );
  });
  it("does not fetch or settle a signed payment on the wrong order", async () => {
    const { repo, calls } = repository(() => attempt);
    const provider = gateway();
    await expect(
      new AcademyPayments(repo, provider).verifyCourt("customer-a", {
        bookingId: attempt.booking_id!,
        razorpay_order_id: "order_B",
        razorpay_payment_id: "pay_A",
        razorpay_signature: sign("order_B|pay_A"),
      }),
    ).rejects.toMatchObject({ code: "INVALID_PAYMENT_SIGNATURE" });
    expect(provider.getPayment).not.toHaveBeenCalled();
    expect(
      calls.mock.calls.some(([action]) => action === "settle_payment"),
    ).toBe(false);
  });
  it("never grants membership on an activated event without a paid invoice", async () => {
    const { repo, calls } = repository((action) =>
      action === "claim_event"
        ? { claimed: true }
        : { ...attempt, booking_id: null, membership_id: "membership-a" },
    );
    const raw = JSON.stringify({
      event: "subscription.activated",
      created_at: 1780500000,
      payload: { subscription: { entity: { id: "sub_A" } } },
    });
    await new AcademyPayments(repo, gateway()).webhook(
      raw,
      sign(raw, config.webhookSecrets[0]),
      "evt_activated",
    );
    expect(
      calls.mock.calls.some(([action]) => action === "subscription_charge"),
    ).toBe(false);
    expect(calls).toHaveBeenCalledWith(
      "finish_event",
      { eventId: "evt_activated", success: true },
      null,
    );
  });
  it("ignores a paid authorization charge with no billing period", async () => {
    const { repo, calls } = repository((action) => action === "claim_event" ? { claimed: true } : { ...attempt, booking_id: null, membership_id: "membership-a" });
    const provider = gateway({ subscriptionInvoices: vi.fn(async () => [{ id: "inv_auth", payment_id: "pay_auth", order_id: "order_auth", amount: 100, amount_paid: 100, currency: "INR", status: "paid", billing_start: null, billing_end: null }]) });
    const raw = JSON.stringify({ event: "subscription.authenticated", created_at: 1780500000, payload: { subscription: { entity: { id: "sub_A" } } } });
    await new AcademyPayments(repo, provider).webhook(raw, sign(raw, config.webhookSecrets[0]), "evt_auth");
    expect(calls.mock.calls.some(([action]) => action === "subscription_charge")).toBe(false);
    expect(provider.getPayment).not.toHaveBeenCalled();
  });
  it("revokes a refunded membership charge without granting its period again", async () => {
    const { repo, calls } = repository((action) => action === "claim_event" ? { claimed: true } : { ...attempt, booking_id: null, membership_id: "membership-a" });
    const provider = gateway({ getPayment: vi.fn(async () => ({ ...payment, amount: 250000, amount_refunded: 250000, invoice_id: "inv_A" })), subscriptionInvoices: vi.fn(async () => [{ id: "inv_A", payment_id: "pay_A", order_id: "order_A", amount: 250000, amount_paid: 250000, currency: "INR", status: "paid", billing_start: 1780500000, billing_end: 1783100000 }]) });
    const raw = JSON.stringify({ event: "subscription.charged", created_at: 1780500000, payload: { subscription: { entity: { id: "sub_A" } }, payment: { entity: { id: "pay_A" } } } });
    await new AcademyPayments(repo, provider).webhook(raw, sign(raw, config.webhookSecrets[0]), "evt_reversed");
    expect(calls).toHaveBeenCalledWith("subscription_reversal", { paymentId: "pay_A", refundedPaise: 250000 }, null);
    expect(calls.mock.calls.some(([action]) => action === "subscription_charge")).toBe(false);
  });
  it("records a terminal failed refund for merchant review and acknowledges its webhook", async () => {
    const { repo, calls } = repository((action) => action === "claim_event" ? { claimed: true } : action === "refund_lookup" ? { id: "refund-job", payment_id: "pay_A", amount_paise: 50000, provider_refund_id: "rfnd_A" } : { ok: true });
    const provider = gateway({ getRefund: vi.fn(async () => ({ id: "rfnd_A", payment_id: "pay_A", amount: 50000, status: "failed" as const })) });
    const raw = JSON.stringify({ event: "refund.failed", created_at: 1780500000, payload: { refund: { entity: { id: "rfnd_A" } } } });
    await expect(new AcademyPayments(repo, provider).webhook(raw, sign(raw, config.webhookSecrets[0]), "evt_refund_failed")).resolves.toEqual({ received: true });
    expect(calls).toHaveBeenCalledWith("refund_finish", expect.objectContaining({ status: "failed", providerRefundId: "rfnd_A" }), null);
    expect(calls).toHaveBeenCalledWith("finish_event", { eventId: "evt_refund_failed", success: true }, null);
  });
  it("does not start provider requests after the staff retry processing deadline", async () => {
    const fetcher = vi.fn();
    await expect(razorpayGateway(config, fetcher, Date.now() - 1).getPayment("pay_A")).rejects.toMatchObject({ status: 503 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("grants the exact paid invoice period using a captured linked payment", async () => {
    const { repo, calls } = repository((action) =>
      action === "claim_event"
        ? { claimed: true }
        : { ...attempt, booking_id: null, membership_id: "membership-a" },
    );
    const provider = gateway({
      getPayment: vi.fn(async () => ({
        ...payment,
        amount: 250000,
        invoice_id: "inv_A",
      })),
      subscriptionInvoices: vi.fn(async () => [
        {
          id: "inv_A",
          payment_id: "pay_A",
          order_id: "order_A",
          amount: 250000,
          amount_paid: 250000,
          currency: "INR",
          status: "paid",
          billing_start: 1780500000,
          billing_end: 1783100000,
        },
      ]),
    });
    const raw = JSON.stringify({
      event: "subscription.charged",
      created_at: 1780500000,
      payload: {
        subscription: { entity: { id: "sub_A" } },
        payment: { entity: { id: "pay_A" } },
      },
    });
    await new AcademyPayments(repo, provider).webhook(
      raw,
      sign(raw, config.webhookSecrets[0]),
      "evt_charged",
    );
    expect(calls).toHaveBeenCalledWith(
      "subscription_charge",
      expect.objectContaining({
        paymentId: "pay_A",
        periodStart: new Date(1780500000000).toISOString(),
        periodEnd: new Date(1783100000000).toISOString(),
      }),
      null,
    );
  });
  it("releases failed event processing for retry and never acknowledges an unfinished claim", async () => {
    const { repo, calls } = repository((action) =>
      action === "claim_event" ? { claimed: true } : attempt,
    );
    const provider = gateway({
      getPayment: vi.fn(async () => {
        throw new AcademyError("Unavailable", 503);
      }),
    });
    const raw = JSON.stringify({
      event: "payment.captured",
      created_at: 1780500000,
      payload: { payment: { entity: { id: "pay_A" } } },
    });
    await expect(
      new AcademyPayments(repo, provider).webhook(
        raw,
        sign(raw, config.webhookSecrets[0]),
        "evt_failure",
      ),
    ).rejects.toThrow();
    expect(calls).toHaveBeenCalledWith(
      "finish_event",
      { eventId: "evt_failure", success: false },
      null,
    );
    const busy = repository(() => ({ claimed: false, processed: false }));
    await expect(
      new AcademyPayments(busy.repo, gateway()).webhook(
        raw,
        sign(raw, config.webhookSecrets[0]),
        "evt_busy",
      ),
    ).rejects.toMatchObject({ code: "PAYMENT_IN_PROGRESS" });
  });
  it("rejects invalid webhook signatures before touching the database", async () => {
    const { repo, calls } = repository();
    await expect(
      new AcademyPayments(repo, gateway()).webhook(
        "{}",
        "a".repeat(64),
        "evt_invalid",
      ),
    ).rejects.toMatchObject({ code: "INVALID_WEBHOOK_SIGNATURE" });
    expect(calls).not.toHaveBeenCalled();
  });
  it("uses the provider's refund idempotency header and validates response", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "rfnd_A",
            payment_id: "pay_A",
            amount: 50000,
            status: "processed",
          }),
          { status: 200 },
        ),
    );
    await razorpayGateway(config, fetcher).refund("pay_A", 50000, attempt.id);
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/payments/pay_A/refund",
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Refund-Idempotency": attempt.id,
        }),
        body: expect.stringContaining('"amount":50000'),
      }),
    );
  });
});
