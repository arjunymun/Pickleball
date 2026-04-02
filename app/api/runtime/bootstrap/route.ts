import { NextResponse } from "next/server";

import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { bootstrapLiveVenueForAuthUser } from "@/lib/supabase/bootstrap-live";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client unavailable." }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let result;
  try {
    result = await bootstrapLiveVenueForAuthUser(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live venue bootstrap failed." },
      { status: 400 },
    );
  }

  const snapshot = await getSupabaseRuntimeSnapshot();

  return NextResponse.json({
    message: result.message,
    snapshot,
  });
}
