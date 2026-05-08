import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/stripe/server";
import { getStripeWebhookSecret } from "@/lib/stripe/env";

async function handleCheckoutCompleted(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  const session = event.data.object as Stripe.Checkout.Session;

  if (!adminSupabase || !session.metadata?.customerProfileId || !session.metadata.kind) {
    return;
  }

  if (session.metadata.kind === "booking" && session.metadata.bookingId) {
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

    const { error } = await adminSupabase.rpc("confirm_booking_from_stripe", {
      checkout_session_id: session.id,
      payment_intent_id: paymentIntentId,
    });

    if (error) {
      await adminSupabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_status: "paid",
          confirmed_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("id", session.metadata.bookingId);

      await adminSupabase
        .from("booking_payments")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntentId,
        })
        .eq("stripe_checkout_session_id", session.id);
    }

    await adminSupabase.from("stripe_checkout_sessions").upsert(
      {
        venue_id: session.metadata.venueId ?? null,
        booking_id: session.metadata.bookingId,
        hold_id: session.metadata.holdId ?? null,
        customer_id: session.metadata.customerProfileId,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        amount_inr: Math.round((session.amount_total ?? 0) / 100),
        status: "complete",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "stripe_checkout_session_id" },
    );

    return;
  }

  if (session.metadata.kind === "pack" && session.metadata.packProductId) {
    const { data: packProduct } = await adminSupabase
      .from("pack_products")
      .select("*")
      .eq("id", session.metadata.packProductId)
      .maybeSingle();

    if (!packProduct) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(packProduct.valid_days));

    await adminSupabase.from("customer_packs").insert({
      customer_id: session.metadata.customerProfileId,
      product_id: packProduct.id,
      credits_remaining: packProduct.included_credits,
      expires_at: expiresAt.toISOString(),
    });

    await adminSupabase.from("wallet_ledger_entries").insert({
      customer_id: session.metadata.customerProfileId,
      amount_inr: packProduct.price_inr,
      kind: "credit_added",
      note: `${packProduct.name} purchased via Stripe Checkout`,
    });
  }

  if (session.metadata.kind === "membership" && session.metadata.membershipPlanId) {
    const { data: membershipPlan } = await adminSupabase
      .from("membership_plans")
      .select("*")
      .eq("id", session.metadata.membershipPlanId)
      .maybeSingle();

    if (!membershipPlan) {
      return;
    }

    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    await adminSupabase.from("customer_memberships").upsert(
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

    if (membershipPlan.included_credits > 0) {
      await adminSupabase.from("wallet_ledger_entries").insert({
        customer_id: session.metadata.customerProfileId,
        amount_inr: membershipPlan.included_credits * 100,
        kind: "membership_benefit_credit",
        note: `${membershipPlan.name} monthly credit drop`,
      });
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

  await adminSupabase
    .from("customer_memberships")
    .update({
      status: nextStatus,
      current_period_ends_at: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null,
      renews_at: periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : new Date().toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq("stripe_subscription_id", subscription.id);
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

  await adminSupabase
    .from("customer_memberships")
    .update({
      status: "paused",
    })
    .eq("stripe_subscription_id", subscriptionId);
}

async function handleCheckoutExpired(event: Stripe.Event) {
  const adminSupabase = createSupabaseAdminClient();
  const session = event.data.object as Stripe.Checkout.Session;

  if (!adminSupabase || session.metadata?.kind !== "booking" || !session.metadata.bookingId) {
    return;
  }

  await adminSupabase
    .from("bookings")
    .update({
      status: "payment_failed",
      payment_status: "failed",
    })
    .eq("id", session.metadata.bookingId)
    .in("status", ["held", "payment_pending"]);

  await adminSupabase
    .from("booking_holds")
    .update({ status: "released" })
    .eq("booking_id", session.metadata.bookingId)
    .eq("status", "active");

  await adminSupabase
    .from("booking_payments")
    .update({ status: "failed" })
    .eq("stripe_checkout_session_id", session.id);
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
  if (adminSupabase) {
    const { error: idempotencyError } = await adminSupabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
    });

    if (idempotencyError?.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event);
  }

  if (event.type === "checkout.session.expired") {
    await handleCheckoutExpired(event);
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await handleSubscriptionEvent(event);
  }

  if (event.type === "invoice.payment_failed") {
    await handleInvoicePaymentFailed(event);
  }

  return NextResponse.json({ received: true });
}
