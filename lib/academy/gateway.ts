import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { PaymentMode } from "@/lib/academy/contracts";
import { AcademyError } from "@/lib/academy/errors";

export interface GatewayConfig {
  keyId: string;
  secret: string;
  webhookSecrets: string[];
  planId: string | null;
  mode: "test" | "live";
}
export function gatewayConfig(): GatewayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const requestedMode = process.env.ACADEMY_PAYMENT_MODE;
  if (
    !keyId ||
    !secret ||
    !["test", "live"].includes(requestedMode ?? "") ||
    !keyId.startsWith(`rzp_${requestedMode}_`)
  )
    return null;
  return {
    keyId,
    secret,
    webhookSecrets: [
      process.env.RAZORPAY_WEBHOOK_SECRET,
      process.env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS,
    ].filter((value): value is string => Boolean(value)),
    planId: process.env.RAZORPAY_MEMBERSHIP_PLAN_ID || null,
    mode: requestedMode as "test" | "live",
  };
}
export function paymentMode(): PaymentMode {
  return gatewayConfig()?.mode ?? "unconfigured";
}
export function signatureMatches(
  message: string,
  signature: string,
  secret: string,
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function gatewayUnavailable(): AcademyError {
  return new AcademyError(
    "Online payments are temporarily unavailable. Please call the academy.",
    503,
    "PAYMENT_UNAVAILABLE",
  );
}

const notes = z
  .record(z.string(), z.string())
  .or(z.array(z.unknown()))
  .optional();
const integer = z.number().int().nonnegative();
const orderSchema = z.object({
  id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  amount: integer,
  currency: z.string(),
  receipt: z.string().nullable().optional(),
  notes,
  status: z.string(),
});
const paymentSchema = z.object({
  id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  order_id: z.string().nullable(),
  invoice_id: z.string().nullable().optional(),
  amount: integer,
  currency: z.string(),
  status: z.string(),
  amount_refunded: integer.default(0),
  created_at: integer,
});
const subscriptionSchema = z.object({
  id: z.string().regex(/^sub_[A-Za-z0-9]+$/),
  plan_id: z.string(),
  status: z.string(),
  current_start: integer.nullable(),
  current_end: integer.nullable(),
  notes,
  has_scheduled_changes: z.boolean().optional(),
  change_scheduled_at: integer.nullable().optional(),
  created_at: integer,
});
const refundSchema = z.object({
  id: z.string().regex(/^rfnd_[A-Za-z0-9]+$/),
  payment_id: z.string(),
  amount: integer,
  status: z.enum(["pending", "processed", "failed"]),
});
const invoiceSchema = z.object({
  id: z.string(),
  payment_id: z.string().nullable(),
  order_id: z.string().nullable(),
  status: z.string(),
  amount: integer,
  amount_paid: integer,
  currency: z.string(),
  billing_start: integer.nullable(),
  billing_end: integer.nullable(),
});
export type GatewayOrder = z.infer<typeof orderSchema>;
export type GatewayPayment = z.infer<typeof paymentSchema>;
export type GatewaySubscription = z.infer<typeof subscriptionSchema>;
export type GatewayRefund = z.infer<typeof refundSchema>;
export type GatewayInvoice = z.infer<typeof invoiceSchema>;

export interface AcademyGateway {
  config: GatewayConfig;
  createOrder(amount: number, attemptId: string): Promise<GatewayOrder>;
  getOrder(id: string): Promise<GatewayOrder>;
  getPayment(id: string): Promise<GatewayPayment>;
  orderPayments(id: string): Promise<GatewayPayment[]>;
  findAttempt(
    kind: "order" | "subscription",
    attemptId: string,
  ): Promise<GatewayOrder | GatewaySubscription | null>;
  createSubscription(attemptId: string): Promise<GatewaySubscription>;
  getSubscription(id: string): Promise<GatewaySubscription>;
  subscriptionInvoices(id: string): Promise<GatewayInvoice[]>;
  cancelSubscription(
    id: string,
    atPeriodEnd: boolean,
  ): Promise<GatewaySubscription>;
  refund(
    paymentId: string,
    amount: number,
    refundId: string,
  ): Promise<GatewayRefund>;
  getRefund(id: string): Promise<GatewayRefund>;
}

export function razorpayGateway(
  config = gatewayConfig(),
  fetcher: typeof fetch = fetch,
  deadline?: number,
): AcademyGateway {
  if (!config) throw gatewayUnavailable();
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    try {
      const remaining = deadline ? deadline - Date.now() : 8000;
      if (remaining <= 0) throw gatewayUnavailable();
      const response = await fetcher(`https://api.razorpay.com/v1/${path}`, {
        method: body ? "POST" : "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(Math.min(8000, remaining)),
        headers: {
          Authorization: `Basic ${Buffer.from(`${config!.keyId}:${config!.secret}`).toString("base64")}`,
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw gatewayUnavailable();
      const parsed = schema.safeParse(await response.json());
      if (!parsed.success) throw gatewayUnavailable();
      return parsed.data;
    } catch (error) {
      if (error instanceof AcademyError) throw error;
      throw gatewayUnavailable();
    }
  }
  async function list<T>(path: string, schema: z.ZodType<T>): Promise<T[]> {
    return (await request(path, z.object({ items: z.array(schema) }))).items;
  }
  return {
    config,
    createOrder: (amount, attemptId) =>
      request("orders", orderSchema, {
        amount,
        currency: "INR",
        receipt: attemptId,
        partial_payment: false,
        notes: { academy_attempt_id: attemptId },
      }),
    getOrder: (id) => request(`orders/${encodeURIComponent(id)}`, orderSchema),
    getPayment: (id) =>
      request(`payments/${encodeURIComponent(id)}`, paymentSchema),
    orderPayments: (id) =>
      list(`orders/${encodeURIComponent(id)}/payments`, paymentSchema),
    async findAttempt(kind, attemptId) {
      // Never create another order/subscription after an ambiguous timeout. Scan a
      // bounded provider history and retain an unresolved job for staff review.
      const matches: Array<GatewayOrder | GatewaySubscription> = [];
      for (let page = 0; page < 5; page++) {
        const items =
          kind === "order"
            ? await list(`orders?count=100&skip=${page * 100}`, orderSchema)
            : await list(
                `subscriptions?count=100&skip=${page * 100}`,
                subscriptionSchema,
              );
        matches.push(
          ...items.filter(
            (item) =>
              !Array.isArray(item.notes) &&
              item.notes?.academy_attempt_id === attemptId,
          ),
        );
        if (matches.length > 1)
          throw new AcademyError(
            "Payment reconciliation needs staff review.",
            503,
            "RECONCILIATION_REQUIRED",
          );
        if (items.length < 100) break;
      }
      return matches[0] ?? null;
    },
    async createSubscription(attemptId) {
      if (!config.planId) throw gatewayUnavailable();
      const plan = await request(
        `plans/${encodeURIComponent(config.planId)}`,
        z.object({
          id: z.string(),
          period: z.string(),
          interval: integer,
          item: z.object({ amount: integer, currency: z.string() }),
        }),
      );
      if (
        plan.period !== "monthly" ||
        plan.interval !== 1 ||
        plan.item.amount !== 250000 ||
        plan.item.currency !== "INR"
      )
        throw gatewayUnavailable();
      return request("subscriptions", subscriptionSchema, {
        plan_id: config.planId,
        quantity: 1,
        total_count: 120,
        customer_notify: true,
        notes: { academy_attempt_id: attemptId },
      });
    },
    getSubscription: (id) =>
      request(`subscriptions/${encodeURIComponent(id)}`, subscriptionSchema),
    subscriptionInvoices: (id) =>
      list(
        `invoices?subscription_id=${encodeURIComponent(id)}&count=100`,
        invoiceSchema,
      ),
    cancelSubscription: (id, atPeriodEnd) =>
      request(
        `subscriptions/${encodeURIComponent(id)}/cancel`,
        subscriptionSchema,
        { cancel_at_cycle_end: atPeriodEnd },
      ),
    refund: (paymentId, amount, refundId) =>
      request(
        `payments/${encodeURIComponent(paymentId)}/refund`,
        refundSchema,
        { amount, speed: "normal", notes: { academy_refund_id: refundId } },
        { "X-Refund-Idempotency": refundId },
      ),
    getRefund: (id) =>
      request(`refunds/${encodeURIComponent(id)}`, refundSchema),
  };
}

export function assertCapturedPayment(
  payment: GatewayPayment,
  orderId: string,
  amount: number,
): void {
  if (
    payment.order_id !== orderId ||
    payment.amount !== amount ||
    payment.currency !== "INR"
  )
    throw new AcademyError(
      "Payment does not match this reservation.",
      409,
      "PAYMENT_MISMATCH",
    );
  if (payment.status !== "captured" || payment.amount_refunded > 0)
    throw new AcademyError(
      "Payment has not been captured. Your booking is not yet confirmed.",
      409,
      "PAYMENT_NOT_CAPTURED",
    );
}
