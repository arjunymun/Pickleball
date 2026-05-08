import { NextResponse } from "next/server";

import { getBookingSnapshot } from "@/lib/booking/server";

export async function GET() {
  const snapshot = await getBookingSnapshot();

  return NextResponse.json({
    source: snapshot.source,
    auth: snapshot.auth,
    upcoming: snapshot.customerExperience.upcomingBookings,
    history: snapshot.customerExperience.slots
      .map((entry) => entry.blockingBooking)
      .filter((booking): booking is NonNullable<typeof booking> => Boolean(booking))
      .filter((booking) => !["held", "payment_pending", "requested", "confirmed"].includes(booking.status)),
  });
}
