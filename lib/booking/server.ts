import { getAvailability } from "@/lib/booking/engine";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import type { RuntimeSnapshot } from "@/lib/runtime-types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getBookingSnapshot(): Promise<RuntimeSnapshot> {
  return getSupabaseRuntimeSnapshot();
}

export async function getAvailabilityPayload(date?: string) {
  const snapshot = await getBookingSnapshot();
  const availability = getAvailability({
    slots: snapshot.customerExperience.slots.map((entry) => entry.slot),
    courts: snapshot.adminDashboard.courts,
    bookings: [
      ...snapshot.customerExperience.upcomingBookings.map((entry) => entry.booking),
      ...snapshot.adminDashboard.schedule
        .map((entry) => entry.blockingBooking)
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    ],
    date,
  });

  return {
    source: snapshot.source,
    auth: snapshot.auth,
    setup: snapshot.setup,
    venue: snapshot.adminDashboard.venue,
    courts: snapshot.adminDashboard.courts,
    availability,
  };
}

export async function requireLiveSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase server client unavailable.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  return { supabase, user };
}

export function getHttpStatusForError(error: unknown) {
  const message = error instanceof Error ? error.message : "Sideout could not complete that action.";
  if (message.includes("Authentication required")) {
    return 401;
  }
  if (message.includes("not configured") || message.includes("unavailable")) {
    return 503;
  }
  if (message.includes("access") || message.includes("Admin")) {
    return 403;
  }
  return 400;
}
