import { z } from "zod";
import { isValidDate } from "@/lib/academy/time";

const id = z.string().uuid();
const key = z
  .string()
  .trim()
  .min(10)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/);
const time = z.string().datetime({ offset: true });
const reason = z.string().trim().min(3).max(1000);
export const holdInput = z
  .object({ courtId: id, startsAt: time, idempotencyKey: key })
  .strict();
export const checkoutInput = z.object({ idempotencyKey: key }).strict();
export const verifyInput = z
  .object({
    bookingId: id,
    razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
    razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
    razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
  })
  .strict();
export const staffBookingInput = holdInput.extend({
  source: z.enum([
    "walk_in",
    "phone",
    "playo",
    "hudle",
    "district",
    "individual_play",
  ]),
  customerName: z.string().trim().min(2).max(120),
  customerId: id.optional(),
  reference: z.string().trim().max(150).optional(),
  reason: reason.optional(),
  amountPaise: z.number().int().min(0).max(500_000).optional(),
  paymentStatus: z
    .enum(["pending", "cash", "external", "not_required"])
    .optional(),
});
export const actionInput = z
  .object({
    action: z.enum(["check_in", "complete", "no_show", "cancel"]),
    reason: reason.optional(),
    refundPaise: z.number().int().min(0).max(500_000).optional(),
    idempotencyKey: key,
  })
  .strict();
export const blockInput = z
  .object({
    courtId: id,
    startsAt: time,
    endsAt: time,
    reason,
    idempotencyKey: key,
  })
  .strict()
  .refine(
    (value) => Date.parse(value.startsAt) < Date.parse(value.endsAt),
    "End must follow start.",
  );
export const noteInput = z
  .object({ body: z.string().trim().min(1).max(2000) })
  .strict();
export const attendanceInput = z
  .object({
    customerId: id,
    date: z.string().refine(isValidDate, "Invalid date."),
    idempotencyKey: key,
  })
  .strict();
export const uuidInput = id;
