import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
import { getStripeWebhookSecret } from "@/lib/stripe/env";

// Errors thrown out of a handler. `retrySafe` decides what happens to the idempotency
// claim on failure:
//   - retrySafe = true  -> the work is idempotent (re-running it changes nothing), so we
//     release the claim and let Stripe re-deliver. Used for the booking confirm (the RPC
//     coalesces confirmed_at and sets fixed values) and the keyed subscription updates.
//   - retrySafe = false -> a non-idempotent grant already partially landed (a wallet
//     credit / pack that has no dedup key). Re-running would double-grant, so we KEEP the
//     claim — a Stripe retry is short-circuited as a duplicate — and log loudly for manual
//     reconciliation instead.
class WebhookHandlerError extends Error {
  readonly retrySafe: boolean;

  constructor(message: string, retrySafe: boolean) {
    super(message);
    this.name = "WebhookHandlerError";
    this.retrySafe = retrySafe;
  }
}

function logWebhook(event: Stripe.Event, message: string, detail?: unknown) {
  // Vercel captures stdout/stderr per invocation, so a tagged console line is the cheapest
  // way to make webhook failures findable in the runtime logs.
  console.error(`[stripe-webhook] ${message}`, {
    eventId: event.id,
    eventType: event.type,
    detail: detail instanceof Error ? detail.message : detail,
  });
}

async function handleCheckoutCompleted(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  const session = event.data.object as Stripe.Checkout.Session;

  if (!adminSupabase || !session.metadata?.customerProfileId || !session.metadata.kind) {
    return;
  }

  if (session.metadata.kind === "booking" && session.metadata.bookingId) {
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    // Checkout sends holdId as "" when no active hold exists; treat blank as null so we
    // never try to write an empty string into the uuid hold_id FK column.
    const holdId = session.metadata.holdId ? session.metadata.holdId : null;

    const { error: rpcError } = await adminSupabase.rpc("confirm_booking_from_stripe", {
      checkout_session_id: session.id,
      payment_intent_id: paymentIntentId,
    });

    if (rpcError) {
      // The RPC may be unavailable on an older schema. Fall back to a direct confirm; the
      // writes below are idempotent (status/payment_status set to fixed values), so failing
      // here is retry-safe.
      logWebhook(event, "confirm_booking_from_stripe rpc failed, using direct fallback", rpcError);

      const { error: bookingError } = await adminSupabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          confirmed_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("id", session.metadata.bookingId);

      if (bookingError) {
        throw new WebhookHandlerError(`booking confirm fallback: ${bookingError.message}`, true);
      }

      const { error: paymentError } = await adminSupabase
        .from("booking_payments")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("stripe_checkout_session_id", session.id);

      if (paymentError) {
        throw new WebhookHandlerError(`booking payment fallback: ${paymentError.message}`, true);
      }
    }

    const { error: sessionRecordError } = await adminSupabase.from("stripe_checkout_sessions").upsert(
      {
        venue_id: session.metadata.venueId ?? null,
        booking_id: session.metadata.bookingId,
        hold_id: holdId,
        customer_id: session.metadata.customerProfileId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount_inr: Math.round((session.amount_total ?? 0) / 100),
        status: "complete",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "stripe_checkout_session_id" },
    );

    // The booking is already confirmed by here; this upsert is record-keeping. It is keyed
    // on the session id (onConflict), so re-running is a no-op -> retry-safe.
    if (sessionRecordError) {
      throw new WebhookHandlerError(`checkout session record: ${sessionRecordError.message}`, true);
    }

    return;
  }

  if (session.metadata.kind === "pack" && session.metadata.packProductId) {
    const { data: packProduct } = await adminSupabase
      .from("pack_products")
      .select("*")
      .eq("id", session.metadata.packProductId)
      .maybeSingle();

    if (!packProduct) {
      logWebhook(event, "pack product not found, skipping grant", session.metadata.packProductId);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(packProduct.valid_days));

    const { error: packError } = await adminSupabase.from("customer_packs").insert({
      customer_id: session.metadata.customerProfileId,
      product_id: packProduct.id,
      credits_remaining: packProduct.included_credits,
      expires_at: expiresAt.toISOString(),
    });

    // Nothing granted yet -> a retry is safe.
    if (packError) {
      throw new WebhookHandlerError(`pack grant: ${packError.message}`, true);
    }

    const { error: ledgerError } = await adminSupabase.from("wallet_ledger_entries").insert({
      customer_id: session.metadata.customerProfileId,
      amount_inr: packProduct.price_inr,
      kind: "credit_added",
      note: `${packProduct.name} purchased via Stripe Checkout`,
    });

    // The pack credits already landed and the ledger row has no dedup key, so re-running
    // would double-grant. Keep the claim and flag for reconciliation.
    if (ledgerError) {
      throw new WebhookHandlerError(`pack ledger entry: ${ledgerError.message}`, false);
    }

    return;
  }

  if (session.metadata.kind === "membership" && session.metadata.membershipPlanId) {
    const { data: membershipPlan } = await adminSupabase
      .from("membership_plans")
      .select("*")
      .eq("id", session.metadata.membershipPlanId)
      .maybeSingle();

    if (!membershipPlan) {
      logWebhook(event, "membership plan not found, skipping grant", session.metadata.membershipPlanId);
      return;
    }

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    const { error: membershipError } = await adminSupabase.from("customer_memberships").upsert(
      {
        customer_id: session.metadata.customerProfileId,
        plan_id: membershipPlan.id,
        status: "active",
        renews_at: renewsAt.toISOString(),
        stripe_subscription_id:
          typeof session.subscription === "string" ? session.subscription : null,
        current_period_ends_at: renewsAt.toISOString(),
        cancel_at_period_end: false,
      },
      { onConflict: "customer_id,plan_id" },
    );

    // Upsert is keyed on (customer_id, plan_id) -> idempotent, retry-safe.
    if (membershipError) {
      throw new WebhookHandlerError(`membership upsert: ${membershipError.message}`, true);
    }

    if (membershipPlan.included_credits > 0) {
      const { error: creditError } = await adminSupabase.from("wallet_ledger_entries").insert({
        customer_id: session.metadata.customerProfileId,
        amount_inr: membershipPlan.included_credits * 100,
        kind: "membership_benefit_credit",
        note: `${membershipPlan.name} monthly credit drop`,
      });

      // Ledger credit has no dedup key; the membership row already landed -> not retry-safe.
      if (creditError) {
        throw new WebhookHandlerError(`membership credit: ${creditError.message}`, false);
      }
    }
  }
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  if (!adminSupabase) {
    return;
  }

  const subscription = event.data.object as Stripe.Subscription;

  const nextStatus =
    subscription.status === "canceled" || subscription.status === "unpaid" ? "expired" : "active";

  const periodEndUnix =
    typeof subscription.items.data[0]?.current_period_end === "number"
      ? subscription.items.data[0].current_period_end
      : null;

  const { error } = await adminSupabase
    .from("customer_memberships")
    .update({
      status: nextStatus,
      current_period_ends_at: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      renews_at: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : new Date().toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Keyed update to fixed values -> idempotent, retry-safe.
  if (error) {
    throw new WebhookHandlerError(`subscription update: ${error.message}`, true);
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  if (!adminSupabase) {
    return;
  }

  const invoice = event.data.object as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const { error } = await adminSupabase
    .from("customer_memberships")
    .update({
      status: "paused",
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Keyed update to a fixed value -> idempotent, retry-safe.
  if (error) {
    throw new WebhookHandlerError(`invoice payment failed update: ${error.message}`, true);
  }
}

async function handleCheckoutExpired(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  const session = event.data.object as Stripe.Checkout.Session;

  if (!adminSupabase || session.metadata?.kind !== "booking" || !session.metadata.bookingId) {
    return;
  }

  const { error: bookingError } = await adminSupabase
    .from("bookings")
    .update({
      status: "payment_failed",
      payment_status: "failed",
    })
    .eq("id", session.metadata.bookingId)
    .in("status", ["held", "payment_pending"]);

  if (bookingError) {
    throw new WebhookHandlerError(`expired booking update: ${bookingError.message}`, true);
  }

  const { error: holdError } = await adminSupabase
    .from("booking_holds")
    .update({ status: "released" })
    .eq("booking_id", session.metadata.bookingId)
    .eq("status", "active");

  if (holdError) {
    throw new WebhookHandlerError(`expired hold release: ${holdError.message}`, true);
  }

  const { error: paymentError } = await adminSupabase
    .from("booking_payments")
    .update({ status: "failed" })
    .eq("stripe_checkout_session_id", session.id);

  if (paymentError) {
    throw new WebhookHandlerError(`expired payment update: ${paymentError.message}`, true);
  }
}

async function dispatch(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event);
      return;
    case "checkout.session.expired":
      await handleCheckoutExpired(event);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(event);
      return;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event);
      return;
    default:
      return;
  }
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook configuration missing." }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Stripe signature missing." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe webhook signature." },
      { status: 400 },
    );
  }

  const adminSupabase = createSupabaseAdminClient();

  // A valid, signed Stripe event arrived but we have no database to record or process it
  // against. Fail loud (Stripe retries) instead of silently acking and losing the paid event.
  if (!adminSupabase) {
    logWebhook(event, "no admin Supabase client configured; cannot process");
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  // Claim the event before processing. A unique violation (23505) means another delivery
  // already claimed it -> ack as a duplicate. If we claim it but processing then fails on a
  // retry-safe handler, we release the claim below so Stripe's re-delivery re-processes it;
  // otherwise a transient error would be recorded as "handled" and the paid event lost.
  const { error: claimError } = await adminSupabase.from("stripe_webhook_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
  });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Could not even record the event (DB unreachable). Fail loud so Stripe retries.
    logWebhook(event, "failed to claim event", claimError);
    return NextResponse.json({ error: "Could not record webhook event." }, { status: 500 });
  }

  try {
    await dispatch(event);
  } catch (error) {
    const retrySafe = error instanceof WebhookHandlerError ? error.retrySafe : false;

    // Release the claim only when re-running the handler is safe. Otherwise keep it so a
    // Stripe retry is short-circuited as a duplicate and cannot double-grant.
    if (retrySafe) {
      await adminSupabase.from("stripe_webhook_events").delete().eq("stripe_event_id", event.id);
    }

    logWebhook(event, retrySafe ? "handler failed (will retry)" : "handler failed (needs reconciliation)", error);

    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
