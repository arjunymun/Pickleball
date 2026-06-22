import { NextResponse } from "next/server";

import { getHttpStatusForError, requireLiveSupabase } from "@/lib/booking/server";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { createHoldSchema, readJsonBody } from "@/lib/validation";

// Postgres error messages / RPC exceptions that mean the slot can no longer be held
// (someone else booked it, a hold already exists, or an overlap constraint fired).
// These must surface as a 409 instead of being swallowed by the legacy fallback.
const CONFLICT_KEYWORDS = [
  "conflict",
  "already_booked",
  "already booked",
  "already unavailable",
  "hold_exists",
  "hold already",
  "blocked by the venue",
  "overlap",
  "23p01", // exclusion_violation (bookings_no_active_overlap)
  "23505", // unique_violation
];

function isConflictError(error: { message?: string; code?: string } | null) {
  if (!error) {
    return false;
  }
  const haystack = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return CONFLICT_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export async function POST(request: Request) {
  try {
    const { supabase } = await requireLiveSupabase();
    const parsed = await readJsonBody(request, createHoldSchema);
    if (parsed.error) {
      return parsed.error;
    }
    const body = parsed.data;

    // Pass offerId through so the RPC can apply the discount and increment the
    // offer's redemption count atomically. When no offer is selected we send null
    // so the DB default (no discount) applies.
    const { data, error } = await supabase.rpc("create_booking_hold_for_current_user", {
      slot_uuid: body.slotId,
      hold_minutes: body.holdMinutes ?? 10,
      offer_uuid: body.offerId ?? null,
    });

    if (error) {
      // Surface real conflicts immediately. Previously this fell through to
      // book_slot_for_current_user, which hid "slot already booked / hold exists"
      // behind a second attempt and lost the original cause.
      console.error("create_booking_hold_for_current_user failed", {
        slotId: body.slotId,
        offerId: body.offerId ?? null,
        code: error.code,
        message: error.message,
      });

      if (isConflictError(error)) {
        return NextResponse.json(
          { error: error.message || "That slot is no longer available." },
          { status: 409 },
        );
      }

      // Non-conflict failure: the hold RPC may be missing on older schemas, so keep the
      // legacy book_slot fallback for those. Include the original error for debugging.
      const fallback = await supabase.rpc("book_slot_for_current_user", {
        slot_uuid: body.slotId,
      });

      if (fallback.error) {
        if (isConflictError(fallback.error)) {
          return NextResponse.json(
            { error: fallback.error.message || "That slot is no longer available." },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: fallback.error.message, originalError: error.message },
          { status: 400 },
        );
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
