import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  AcademyBooking,
  AcademyMembership,
  CourtCheckoutPayload,
  MembershipCheckoutPayload,
} from "@/lib/academy/contracts";
import { AcademyError } from "@/lib/academy/errors";
import {
  assertCapturedPayment,
  signatureMatches,
  type AcademyGateway,
  type GatewayInvoice,
  type GatewayPayment,
} from "@/lib/academy/gateway";
import type { AcademyRepository } from "@/lib/academy/repository";

export interface PaymentAttempt {
  id: string;
  booking_id: string | null;
  membership_id: string | null;
  actor_id: string;
  provider_id: string | null;
  amount_paise: number;
  status: string;
  create?: boolean;
}
interface RefundJob {
  id: string;
  payment_id: string;
  amount_paise: number;
  provider_refund_id: string | null;
}
interface StoredEvent {
  id: string;
  body_hash: string;
  payload: WebhookEvent;
}
interface SubscriptionJob {
  id: string;
  subscription_id: string;
}
interface Jobs {
  attempts: PaymentAttempt[];
  refunds: RefundJob[];
  events: StoredEvent[];
  subscriptions: SubscriptionJob[];
  orders?: PaymentAttempt[];
  cancellations?: Array<SubscriptionJob & { customer_id: string }>;
}
const webhookSchema = z.object({
  event: z.string().min(1),
  created_at: z.number().int().nonnegative(),
  payload: z.record(
    z.string(),
    z.object({ entity: z.record(z.string(), z.unknown()) }),
  ),
});
type WebhookEvent = z.infer<typeof webhookSchema>;
const iso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class AcademyPayments {
  constructor(
    private readonly repo: AcademyRepository,
    private readonly gateway: AcademyGateway,
  ) {}

  async courtCheckout(
    actor: string,
    bookingId: string,
    idempotencyKey: string,
  ): Promise<CourtCheckoutPayload> {
    const attempt = await this.repo.dispatch<PaymentAttempt>(
      "prepare_order",
      { bookingId, idempotencyKey },
      actor,
    );
    if (attempt.create) {
      try {
        const order = await this.gateway.createOrder(
          attempt.amount_paise,
          attempt.id,
        );
        if (
          order.currency !== "INR" ||
          order.amount !== attempt.amount_paise ||
          order.receipt !== attempt.id
        )
          throw new AcademyError(
            "Payment order does not match the reservation.",
            503,
            "PAYMENT_MISMATCH",
          );
        await this.repo.dispatch("attach_provider", {
          attemptId: attempt.id,
          providerId: order.id,
          amountPaise: order.amount,
        });
        attempt.provider_id = order.id;
      } catch (error) {
        await this.repo.dispatch("mark_reconcile", { attemptId: attempt.id });
        throw error;
      }
    }
    if (!attempt.provider_id)
      throw new AcademyError(
        "Payment setup needs reconciliation.",
        503,
        "RECONCILIATION_REQUIRED",
      );
    // A slow provider request must not return payable checkout for an expired hold.
    await this.repo.dispatch(
      "prepare_order",
      { bookingId, idempotencyKey },
      actor,
    );
    return {
      keyId: this.gateway.config.keyId,
      orderId: attempt.provider_id,
      amountPaise: attempt.amount_paise,
      currency: "INR",
      bookingId,
      testMode: this.gateway.config.mode === "test",
    };
  }

  async verifyCourt(
    actor: string,
    input: {
      bookingId: string;
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ): Promise<{ booking: AcademyBooking }> {
    const attempt = await this.repo.dispatch<PaymentAttempt>(
      "order_mapping",
      { bookingId: input.bookingId },
      actor,
    );
    if (
      !attempt.provider_id ||
      attempt.provider_id !== input.razorpay_order_id ||
      !signatureMatches(
        `${attempt.provider_id}|${input.razorpay_payment_id}`,
        input.razorpay_signature,
        this.gateway.config.secret,
      )
    )
      throw new AcademyError(
        "Payment verification failed.",
        400,
        "INVALID_PAYMENT_SIGNATURE",
      );
    const payment = await this.gateway.getPayment(input.razorpay_payment_id);
    assertCapturedPayment(payment, attempt.provider_id, attempt.amount_paise);
    const result = await this.settleCourt(payment);
    if (!result)
      throw new AcademyError(
        "Payment mapping was not found.",
        409,
        "PAYMENT_MISMATCH",
      );
    return result;
  }

  private async settleCourt(
    payment: GatewayPayment,
  ): Promise<{ booking: AcademyBooking } | null> {
    if (!payment.order_id) return null;
    const attempt = await this.repo.dispatch<PaymentAttempt | null>(
      "provider_mapping",
      { providerId: payment.order_id },
    );
    if (!attempt?.booking_id) return null;
    assertCapturedPayment(payment, attempt.provider_id!, attempt.amount_paise);
    return this.repo.dispatch("settle_payment", {
      orderId: payment.order_id,
      paymentId: payment.id,
      amountPaise: payment.amount,
      capturedAt: iso(payment.created_at),
    });
  }

  async membershipCheckout(
    actor: string,
    idempotencyKey: string,
  ): Promise<MembershipCheckoutPayload> {
    if (!this.gateway.config.planId)
      throw new AcademyError(
        "Monthly memberships are not yet available online.",
        503,
        "MEMBERSHIP_UNAVAILABLE",
      );
    const attempt = await this.repo.dispatch<PaymentAttempt>(
      "prepare_subscription",
      { idempotencyKey },
      actor,
    );
    if (attempt.create) {
      try {
        const subscription = await this.gateway.createSubscription(attempt.id);
        if (subscription.plan_id !== this.gateway.config.planId)
          throw new AcademyError(
            "Membership plan could not be verified.",
            503,
            "PAYMENT_MISMATCH",
          );
        await this.repo.dispatch("attach_provider", {
          attemptId: attempt.id,
          providerId: subscription.id,
          amountPaise: attempt.amount_paise,
        });
        attempt.provider_id = subscription.id;
      } catch (error) {
        await this.repo.dispatch("mark_reconcile", { attemptId: attempt.id });
        throw error;
      }
    }
    if (!attempt.provider_id)
      throw new AcademyError(
        "Membership setup needs reconciliation.",
        503,
        "RECONCILIATION_REQUIRED",
      );
    return {
      keyId: this.gateway.config.keyId,
      subscriptionId: attempt.provider_id,
      amountPaise: attempt.amount_paise,
      currency: "INR",
      testMode: this.gateway.config.mode === "test",
    };
  }

  async cancelMembership(
    actor: string,
    membershipId?: string,
  ): Promise<{ membership: AcademyMembership }> {
    const input = membershipId ? { membershipId } : {};
    const membership = await this.repo.dispatch<{
      id: string;
      subscription_id: string | null;
      paid_through: string | null;
      cancel_at_period_end: boolean;
    }>("cancel_membership", input, actor);
    if (membership.subscription_id && !membership.cancel_at_period_end) {
      const current = await this.gateway.getSubscription(
        membership.subscription_id,
      );
      if (!["cancelled", "completed", "expired"].includes(current.status)) {
        await this.gateway.cancelSubscription(
          membership.subscription_id,
          Boolean(
            membership.paid_through &&
            Date.parse(membership.paid_through) > Date.now(),
          ),
        );
      }
    }
    return this.repo.dispatch(
      "cancel_membership",
      { membershipId: membership.id, providerConfirmed: true },
      actor,
    );
  }

  private async applyInvoice(
    subscriptionId: string,
    invoice: GatewayInvoice,
  ): Promise<void> {
    if (invoice.status !== "paid" || !invoice.payment_id) return;
    // Authorization charges do not represent a paid membership billing period.
    if (!invoice.billing_start && !invoice.billing_end) return;
    if (
      invoice.amount !== 250000 ||
      invoice.amount_paid !== 250000 ||
      invoice.currency !== "INR" ||
      !invoice.billing_start ||
      !invoice.billing_end ||
      invoice.billing_start >= invoice.billing_end ||
      !invoice.order_id
    )
      throw new AcademyError(
        "Membership invoice needs reconciliation.",
        503,
        "PAYMENT_MISMATCH",
      );
    const payment = await this.gateway.getPayment(invoice.payment_id);
    if (payment.amount_refunded > 0) {
      await this.repo.dispatch("subscription_reversal", {
        paymentId: payment.id,
        refundedPaise: payment.amount_refunded,
      });
      return;
    }
    assertCapturedPayment(payment, invoice.order_id, 250000);
    if (payment.invoice_id !== invoice.id)
      throw new AcademyError(
        "Membership payment does not match its invoice.",
        409,
        "PAYMENT_MISMATCH",
      );
    await this.repo.dispatch("subscription_charge", {
      subscriptionId,
      paymentId: payment.id,
      amountPaise: payment.amount,
      capturedAt: iso(payment.created_at),
      periodStart: iso(invoice.billing_start),
      periodEnd: iso(invoice.billing_end),
    });
  }

  private async reconcileSubscription(
    subscriptionId: string,
    paymentId?: string,
    eventTime = Math.floor(Date.now() / 1000),
  ): Promise<void> {
    const mapping = await this.repo.dispatch<PaymentAttempt | null>(
      "provider_mapping",
      { providerId: subscriptionId },
    );
    if (!mapping?.membership_id) return;
    const subscription = await this.gateway.getSubscription(subscriptionId);
    if (
      !this.gateway.config.planId ||
      subscription.plan_id !== this.gateway.config.planId
    )
      throw new AcademyError(
        "Membership plan does not match the academy plan.",
        503,
        "PAYMENT_MISMATCH",
      );
    const invoices = await this.gateway.subscriptionInvoices(subscriptionId);
    if (paymentId) {
      const invoice = invoices.find((item) => item.payment_id === paymentId);
      if (!invoice)
        throw new AcademyError(
          "Membership charge is awaiting its invoice.",
          503,
          "RECONCILIATION_REQUIRED",
        );
      await this.applyInvoice(subscriptionId, invoice);
    } else {
      for (const invoice of invoices
        .filter((item) => item.status === "paid")
        .slice(0, 3))
        await this.applyInvoice(subscriptionId, invoice);
    }
    await this.repo.dispatch("membership_state", {
      subscriptionId,
      state: subscription.status,
      eventTime,
    });
  }

  async webhook(
    raw: string,
    signature: string,
    eventId: string,
  ): Promise<{ received: true; duplicate?: boolean }> {
    if (
      !this.gateway.config.webhookSecrets.some((secret) =>
        signatureMatches(raw, signature, secret),
      )
    )
      throw new AcademyError(
        "Invalid webhook signature.",
        400,
        "INVALID_WEBHOOK_SIGNATURE",
      );
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(eventId))
      throw new AcademyError(
        "Missing webhook event identifier.",
        400,
        "INVALID_REQUEST",
      );
    let payload: WebhookEvent;
    try {
      payload = webhookSchema.parse(JSON.parse(raw));
    } catch {
      throw new AcademyError(
        "Invalid webhook payload.",
        400,
        "INVALID_REQUEST",
      );
    }
    return this.processEvent(
      eventId,
      createHash("sha256").update(raw).digest("hex"),
      payload,
    );
  }

  private async processEvent(
    eventId: string,
    bodyHash: string,
    payload: WebhookEvent,
  ): Promise<{ received: true; duplicate?: boolean }> {
    const claim = await this.repo.dispatch<{
      claimed: boolean;
      processed?: boolean;
    }>("claim_event", { eventId, bodyHash, payload });
    if (!claim.claimed) {
      if (!claim.processed)
        throw new AcademyError(
          "This event is still being processed.",
          409,
          "PAYMENT_IN_PROGRESS",
        );
      return { received: true, duplicate: true };
    }
    try {
      const paymentId = payload.payload.payment?.entity.id;
      const subscriptionId = payload.payload.subscription?.entity.id;
      if (
        payload.event === "payment.captured" &&
        typeof paymentId === "string"
      ) {
        const payment = await this.gateway.getPayment(paymentId);
        await this.settleCourt(payment);
      } else if (
        payload.event === "subscription.charged" &&
        typeof subscriptionId === "string" &&
        typeof paymentId === "string"
      ) {
        await this.reconcileSubscription(
          subscriptionId,
          paymentId,
          payload.created_at,
        );
      } else if (
        payload.event.startsWith("subscription.") &&
        typeof subscriptionId === "string"
      ) {
        await this.reconcileSubscription(
          subscriptionId,
          undefined,
          payload.created_at,
        );
      } else if (
        payload.event.startsWith("refund.") &&
        typeof payload.payload.refund?.entity.id === "string"
      ) {
        const refund = await this.gateway.getRefund(
          payload.payload.refund.entity.id,
        );
        const job = await this.repo.dispatch<RefundJob | null>(
          "refund_lookup",
          { providerRefundId: refund.id },
        );
        if (job) await this.recordRefund(job, refund, false);
      } else if (
        payload.event === "payment.refunded" &&
        typeof paymentId === "string"
      ) {
        const payment = await this.gateway.getPayment(paymentId);
        if (payment.amount_refunded > 0)
          await this.repo.dispatch("subscription_reversal", {
            paymentId: payment.id,
            refundedPaise: payment.amount_refunded,
          });
      }
      await this.repo.dispatch("finish_event", { eventId, success: true });
      return { received: true };
    } catch (error) {
      await this.repo.dispatch("finish_event", { eventId, success: false });
      throw error;
    }
  }

  private async recordRefund(
    job: RefundJob,
    refund: Awaited<ReturnType<AcademyGateway["refund"]>>,
    raiseFailure = true,
  ): Promise<void> {
    if (
      refund.amount !== job.amount_paise ||
      refund.payment_id !== job.payment_id
    )
      throw new AcademyError(
        "Refund needs reconciliation.",
        503,
        "PAYMENT_MISMATCH",
      );
    await this.repo.dispatch("refund_finish", {
      refundId: job.id,
      providerRefundId: refund.id,
      paymentId: refund.payment_id,
      amountPaise: refund.amount,
      status: refund.status,
    });
    if (refund.status === "failed" && raiseFailure)
      throw new AcademyError(
        "The refund needs staff review.",
        503,
        "REFUND_FAILED",
      );
  }

  async reconcile(
    budgetMs = 85_000,
  ): Promise<{ processed: number; failed: number; unresolved: number }> {
    const deadline = Date.now() + budgetMs;
    const jobs = await this.repo.dispatch<Jobs>("jobs");
    let processed = 0,
      failed = 0,
      unresolved = 0;
    const work: Array<{
      run: () => Promise<void>;
      job?: { kind: string; id: string };
    }> = [];
    for (const membership of jobs.cancellations ?? [])
      work.push({
        job: { kind: "membership", id: membership.id },
        run: async () => {
          await this.cancelMembership(membership.customer_id, membership.id);
        },
      });
    for (const attempt of jobs.attempts)
      work.push({
        job: { kind: "attempt", id: attempt.id },
        run: async () => {
          const entity = await this.gateway.findAttempt(
            attempt.booking_id ? "order" : "subscription",
            attempt.id,
          );
          if (!entity) {
            unresolved++;
            return;
          }
          const amount =
            "amount" in entity ? entity.amount : attempt.amount_paise;
          if (
            ("currency" in entity && entity.currency !== "INR") ||
            amount !== attempt.amount_paise ||
            ("plan_id" in entity &&
              entity.plan_id !== this.gateway.config.planId)
          )
            throw new AcademyError(
              "Payment mapping needs reconciliation.",
              503,
              "PAYMENT_MISMATCH",
            );
          await this.repo.dispatch("attach_provider", {
            attemptId: attempt.id,
            providerId: entity.id,
            amountPaise: amount,
          });
          if (attempt.booking_id)
            for (const payment of await this.gateway.orderPayments(entity.id))
              if (
                payment.status === "captured" &&
                payment.amount_refunded === 0
              )
                await this.settleCourt(payment);
        },
      });
    for (const job of jobs.refunds)
      work.push({
        job: { kind: "refund", id: job.id },
        run: async () => {
          const refund = job.provider_refund_id
            ? await this.gateway.getRefund(job.provider_refund_id)
            : await this.gateway.refund(
                job.payment_id,
                job.amount_paise,
                job.id,
              );
          await this.recordRefund(job, refund);
        },
      });
    for (const event of jobs.events)
      work.push({
        run: async () => {
          await this.processEvent(
            event.id,
            event.body_hash,
            webhookSchema.parse(event.payload),
          );
        },
      });
    for (const subscription of jobs.subscriptions)
      work.push({
        job: { kind: "membership", id: subscription.id },
        run: () => this.reconcileSubscription(subscription.subscription_id),
      });
    for (const order of jobs.orders ?? [])
      work.push({
        job: { kind: "attempt", id: order.id },
        run: async () => {
          for (const payment of await this.gateway.orderPayments(
            order.provider_id!,
          ))
            if (payment.status === "captured" && payment.amount_refunded === 0)
              await this.settleCourt(payment);
        },
      });
    for (const task of work) {
      if (Date.now() > deadline) {
        unresolved++;
        continue;
      }
      try {
        await task.run();
        processed++;
      } catch (error) {
        failed++;
        console.error("academy reconciliation failed", {
          code:
            error instanceof AcademyError ? error.code : "BACKEND_UNAVAILABLE",
        });
      } finally {
        if (task.job) await this.repo.dispatch("job_checked", task.job);
      }
    }
    return { processed, failed, unresolved };
  }
}
