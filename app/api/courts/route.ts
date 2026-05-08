import { NextResponse } from "next/server";

import { getBookingSnapshot } from "@/lib/booking/server";

export async function GET() {
  const snapshot = await getBookingSnapshot();

  return NextResponse.json({
    source: snapshot.source,
    venue: snapshot.adminDashboard.venue,
    courts: snapshot.adminDashboard.courts,
  });
}
