import { NextResponse } from "next/server";

import { getHttpStatusForError, requireLiveSupabase } from "@/lib/booking/server";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";

export async function POST(request: Request) {
  try {
    const { supabase } = await requireLiveSupabase();
    const body = (await request.json()) as { slotId?: string; holdMinutes?: number };

    if (!body.slotId) {
      return NextResponse.json({ error: "slotId is required." }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("create_booking_hold_for_current_user", {
      slot_uuid: body.slotId,
      hold_minutes: body.holdMinutes ?? 10,
    });

    if (error) {
      const fallback = await supabase.rpc("book_slot_for_current_user", {
        slot_uuid: body.slotId,
      });

      if (fallback.error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const snapshot = await getSupabaseRuntimeSnapshot();
      return NextResponse.json({
        message: typeof fallback.data === "string" ? fallback.data : "Booking created.",
        snapshot,
      });
    }

    const snapshot = await getSupabaseRuntimeSnapshot();

    return NextResponse.json({
      message: typeof data === "string" ? data : "Court held. Continue to checkout to confirm.",
      snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sideout could not create that hold." },
      { status: getHttpStatusForError(error) },
    );
  }
}
