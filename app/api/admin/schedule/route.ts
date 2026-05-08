import { NextResponse } from "next/server";

import { getBookingSnapshot } from "@/lib/booking/server";

export async function GET() {
  const snapshot = await getBookingSnapshot();

  if (snapshot.source === "supabase" && !snapshot.capabilities.adminLive) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json({
    source: snapshot.source,
    venue: snapshot.adminDashboard.venue,
    venueSettings: snapshot.adminDashboard.venueSettings,
    schedule: snapshot.adminDashboard.schedule,
    metrics: snapshot.adminDashboard.metrics,
    requestQueue: snapshot.adminDashboard.requestQueue,
    payments: snapshot.adminDashboard.upcomingConfirmed.map((entry) => ({
      bookingId: entry.booking.id,
      customerName: entry.customer.name,
      slotLabel: entry.slot.label,
      paymentStatus: entry.booking.paymentStatus,
      amountInr: entry.slot.priceInr,
    })),
  });
}
