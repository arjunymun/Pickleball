import { NextResponse } from "next/server";

import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client unavailable." }, { status: 503 });
  }

  const body = (await request.json()) as {
    venueId?: string;
    cancellationCutoffHours?: number;
    bookingWindowDays?: number;
    reminderLeadHours?: number[];
    publicContactPhone?: string;
    publicContactEmail?: string;
    publicWhatsappNumber?: string;
    memberDiscountPercent?: number;
    featuredAnnouncement?: string;
  };

  const snapshotBefore = await getSupabaseRuntimeSnapshot();
  const venueId = body.venueId ?? snapshotBefore.setup.venueId;

  if (!venueId) {
    return NextResponse.json({ error: "venueId is required." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("update_venue_settings_as_admin", {
    venue_uuid: venueId,
    cancellation_cutoff: body.cancellationCutoffHours ?? 6,
    booking_window: body.bookingWindowDays ?? 14,
    reminder_hours: body.reminderLeadHours ?? [24, 2],
    contact_phone: body.publicContactPhone ?? "",
    contact_email: body.publicContactEmail ?? "",
    whatsapp_number: body.publicWhatsappNumber ?? "",
    member_discount: body.memberDiscountPercent ?? 10,
    announcement_text: body.featuredAnnouncement ?? "",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const snapshot = await getSupabaseRuntimeSnapshot();

  return NextResponse.json({
    message: typeof data === "string" ? data : "Venue settings updated.",
    snapshot,
  });
}
