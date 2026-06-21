import { NextResponse } from "next/server";

import { getHttpStatusForError, requireLiveSupabase } from "@/lib/booking/server";
import { getStripeServerClient } from "@/lib/stripe/server";
import { getSiteUrl } from "@/lib/supabase/env";

export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  try {
    const stripe = getStripeServerClient();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const { supabase, user } = await requireLiveSupabase();
    const { bookingId } = await context.params;

    const { data: booking } = await supabase
      .from("bookings")
      .select("*, bookable_slots(*)")
      .eq("id", bookingId)
      .maybeSingle();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const slot = Array.isArray(booking.bookable_slots) ? booking.bookable_slots[0] : booking.bookable_slots;
    const amountInr = Number(booking.total_amount_inr ?? slot?.price_inr ?? 0);

    if (amountInr <= 0) {
      return NextResponse.json({ error: "Booking amount is missing." }, { status: 400 });
    }

    // The webhook (stripe/webhooks) upserts stripe_checkout_sessions.hold_id from
    // session.metadata.holdId. The active hold is tracked in booking_holds keyed by
    // booking_id (there is no bookings.hold_id column), so resolve it here and pass it
    // through metadata — otherwise hold_id is always persisted as null and the
    // checkout-session -> hold linkage is lost.
    const { data: activeHold } = await supabase
      .from("booking_holds")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("status", "active")
      .maybeSingle();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      success_url: `${getSiteUrl()}/app/bookings/confirmation?booking=${bookingId}&checkout=success`,
      cancel_url: `${getSiteUrl()}/app/bookings?checkout=canceled`,
      metadata: {
        kind: "booking",
        bookingId,
        holdId: activeHold?.id ?? "",
        venueId: String(booking.venue_id ?? slot?.venue_id ?? ""),
        customerProfileId: String(booking.customer_id),
        slotId: String(booking.slot_id),
      },
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: String(slot?.label ?? "Sideout court booking"),
              description: slot?.starts_at ? `Court reservation for ${new Date(String(slot.starts_at)).toLocaleString()}` : undefined,
            },
            unit_amount: amountInr * 100,
          },
          quantity: 1,
        },
      ],
    });

    await supabase
      .from("booking_payments")
      .upsert(
        {
          booking_id: bookingId,
          amount_inr: amountInr,
          mode: "online",
          status: "pending",
          stripe_checkout_session_id: session.id,
        },
        { onConflict: "stripe_checkout_session_id" },
      );

    await supabase
      .from("bookings")
      .update({
        status: "payment_pending",
        payment_status: "pending",
        stripe_checkout_session_id: session.id,
      })
      .eq("id", bookingId);

    return NextResponse.json({ url: session.url, checkoutSessionId: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sideout could not start checkout." },
      { status: getHttpStatusForError(error) },
    );
  }
}
