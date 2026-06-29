import { NextResponse } from "next/server";

import { getHttpStatusForError, requireLiveSupabase } from "@/lib/booking/server";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { adminBlockSchema, readJsonBody } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { supabase } = await requireLiveSupabase();
    const parsed = await readJsonBody(request, adminBlockSchema);
    if (parsed.error) {
      return parsed.error;
    }
    const body = parsed.data;

    const { error } = await supabase.from("admin_blocks").insert({
      venue_id: body.venueId,
      court_id: body.courtId,
      starts_at: body.startsAt,
      ends_at: body.endsAt,
      reason: body.reason ?? "Operator block",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Court block added.",
      snapshot: await getSupabaseRuntimeSnapshot(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sideout could not block that court." },
      { status: getHttpStatusForError(error) },
    );
  }
}
