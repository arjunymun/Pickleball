import { cookies } from "next/headers";
import type {
  AcademySession,
  AcademyUser,
  AdminCustomersPayload,
  AdminSchedulePayload,
  AvailabilityPayload,
  CustomerAccountPayload,
} from "@/lib/academy/contracts";
import { AcademyError, unavailable } from "@/lib/academy/errors";
import { paymentMode, razorpayGateway } from "@/lib/academy/gateway";
import { AcademyPayments } from "@/lib/academy/payments";
import { academyRepository } from "@/lib/academy/repository";
import { indiaDate, isValidDate } from "@/lib/academy/time";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAcademyConfigured } from "@/lib/supabase/env";
import type { AdminReconciliationPayload } from "@/lib/academy/reconciliation-types";

async function bounded<T>(work: Promise<T>, milliseconds = 6500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(unavailable()), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getAcademySession(): Promise<AcademySession> {
  const empty: AcademySession = {
    user: null,
    configured: isAcademyConfigured(),
    paymentMode: paymentMode(),
    membership: null,
  };
  if (!empty.configured) return empty;
  const store = await cookies();
  if (
    !store
      .getAll()
      .some(
        (cookie) =>
          cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
      )
  )
    return empty;
  const client = await createServerSupabaseClient();
  if (!client) throw unavailable();
  try {
    const { data, error } = await bounded(client.auth.getUser());
    if (error) {
      if (
        (error.status && error.status >= 500) ||
        error.name === "AuthRetryableFetchError"
      )
        throw unavailable();
      return empty;
    }
    if (!data.user) return empty;
    if (!data.user.email)
      throw new AcademyError(
        "Please use Google or email sign-in.",
        403,
        "EMAIL_REQUIRED",
      );
    const metadata = data.user.user_metadata;
    const name =
      typeof metadata.full_name === "string"
        ? metadata.full_name
        : typeof metadata.name === "string"
          ? metadata.name
          : "Academy player";
    const session = await academyRepository().dispatch<
      Pick<AcademySession, "user" | "membership">
    >(
      "repair_customer",
      { email: data.user.email, name, phone: data.user.phone || null },
      data.user.id,
    );
    if (
      !session.user?.id ||
      !["customer", "staff", "owner"].includes(session.user.role)
    )
      throw unavailable();
    return { ...empty, ...session };
  } catch (error) {
    if (error instanceof AcademyError) throw error;
    throw unavailable();
  }
}

export async function requireAcademyUser(staff = false): Promise<AcademyUser> {
  const session = await getAcademySession();
  if (!session.configured) throw unavailable();
  if (!session.user)
    throw new AcademyError("Please sign in to continue.", 401, "AUTH_REQUIRED");
  if (staff && !["staff", "owner"].includes(session.user.role))
    throw new AcademyError("Staff access is required.", 403, "FORBIDDEN");
  return session.user;
}

export function validateAcademyDate(value: string | null): string {
  const date = value ?? indiaDate();
  if (!isValidDate(date))
    throw new AcademyError("Choose a valid calendar date.");
  return date;
}

export async function getAcademyAvailability(
  date: string,
): Promise<AvailabilityPayload> {
  const session = await getAcademySession();
  return academyRepository().dispatch(
    "availability",
    { date },
    session.user?.id ?? null,
  );
}
export async function getAcademyAccount(): Promise<CustomerAccountPayload> {
  const user = await requireAcademyUser();
  return {
    ...(await academyRepository().dispatch<
      Omit<CustomerAccountPayload, "paymentMode">
    >("account", {}, user.id)),
    paymentMode: paymentMode(),
  };
}
export async function getAcademySchedule(
  date: string,
): Promise<AdminSchedulePayload> {
  const user = await requireAcademyUser(true);
  return {
    ...(await academyRepository().dispatch<
      Omit<AdminSchedulePayload, "paymentMode">
    >("schedule", { date }, user.id)),
    paymentMode: paymentMode(),
  };
}
export async function getAcademyCustomers(): Promise<AdminCustomersPayload> {
  const user = await requireAcademyUser(true);
  return academyRepository().dispatch("customers", {}, user.id);
}
export function academyPayments(deadline?: number): AcademyPayments {
  return new AcademyPayments(
    academyRepository(),
    razorpayGateway(undefined, fetch, deadline),
  );
}
export async function getAcademyReconciliation(): Promise<AdminReconciliationPayload> {
  const user = await requireAcademyUser(true);
  return {
    ...(await academyRepository().dispatch<
      Omit<AdminReconciliationPayload, "paymentMode" | "instructions">
    >("reconciliation", {}, user.id)),
    paymentMode: paymentMode(),
    instructions: [
      "Retry safely processes queued jobs; failed refunds need merchant review in Razorpay before any further refund is issued.",
      "Use the displayed order, payment or refund reference in the merchant dashboard. An unprocessed refund has not returned money to the customer.",
      "An ambiguous order or subscription creation must be matched by its academy_attempt_id note. Never create a replacement blindly.",
    ],
  };
}
