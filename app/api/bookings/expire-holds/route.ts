import { NextResponse } from "next/server";

import { getHttpStatusForError, requireLiveSupabase } from "@/lib/booking/server";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";

export async function POST() {
  try {
    const { supabase } = await requireLiveSupabase();
    const { data, error } = await supabase.rpc("expire_stale_booking_holds");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: typeof data === "string" ? data : "Expired holds cleaned up.",
      snapshot: await getSupabaseRuntimeSnapshot(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sideout could not expire holds." },
      { status: getHttpStatusForError(error) },
    );
  }
}
