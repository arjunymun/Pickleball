import { NextResponse } from "next/server";
import { z } from "zod";

// Shared request-body validation for the API routes. readJsonBody parses the JSON (returning
// a 400 on malformed bodies instead of letting request.json() throw a 500), then runs the
// zod schema and returns either the typed data or a ready-to-return 400 NextResponse.
//
// Only the version-stable zod surface is used here (object/string/number/array/enum/literal,
// min/int/positive/refine/optional, coerce, safeParse) so it holds across zod majors.

export type JsonBodyResult<T> = { data: T; error?: undefined } | { data?: undefined; error: NextResponse };

export async function readJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<JsonBodyResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { error: NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join(".") || "(body)",
      message: issue.message,
    }));
    return { error: NextResponse.json({ error: "Invalid request body.", details }, { status: 400 }) };
  }

  return { data: result.data };
}

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} is required.`);
const optionalText = z.string().optional();
// Lenient ISO date-time: accepts any string Date.parse understands (offset-aware ISO strings
// from the client) without locking to a single zod date format that differs across majors.
const isoDateTime = (label: string) =>
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: `${label} must be a valid date-time.`,
  });

export const bookSlotSchema = z.object({
  slotId: nonEmpty("slotId"),
});

export const createHoldSchema = z.object({
  slotId: nonEmpty("slotId"),
  holdMinutes: z.coerce.number().int().positive().max(240).optional(),
  offerId: z.string().trim().min(1).optional(),
});

export const walletCreditSchema = z.object({
  customerId: nonEmpty("customerId"),
  amountInr: z.coerce.number().int().positive(),
  note: nonEmpty("note"),
});

export const customerNoteSchema = z.object({
  customerId: nonEmpty("customerId"),
  body: nonEmpty("body"),
});

export const sendMessageSchema = z.object({
  customerId: nonEmpty("customerId"),
  templateId: nonEmpty("templateId"),
  body: nonEmpty("body"),
});

export const venueSettingsSchema = z.object({
  venueId: z.string().trim().min(1).optional(),
  cancellationCutoffHours: z.coerce.number().int().min(0).optional(),
  bookingWindowDays: z.coerce.number().int().min(1).optional(),
  reminderLeadHours: z.array(z.coerce.number().int().min(0)).optional(),
  publicContactPhone: optionalText,
  publicContactEmail: optionalText,
  publicWhatsappNumber: optionalText,
  memberDiscountPercent: z.coerce.number().int().min(0).max(100).optional(),
  featuredAnnouncement: optionalText,
});

export const adminBlockSchema = z.object({
  venueId: nonEmpty("venueId"),
  courtId: nonEmpty("courtId"),
  startsAt: isoDateTime("startsAt"),
  endsAt: isoDateTime("endsAt"),
  reason: z.string().optional(),
});

export const checkoutSchema = z.object({
  kind: z.enum(["pack", "membership"]),
  resourceId: nonEmpty("resourceId"),
});

export const portfolioAccountSchema = z.object({
  role: z.enum(["customer", "operator"]).optional(),
});
