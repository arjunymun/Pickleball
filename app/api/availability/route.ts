import { NextResponse } from "next/server";

import { getAvailabilityPayload } from "@/lib/booking/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? undefined;

  return NextResponse.json(await getAvailabilityPayload(date));
}
