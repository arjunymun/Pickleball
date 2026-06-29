import { NextResponse } from "next/server";

import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { customerNoteSchema, readJsonBody } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client unavailable." }, { status: 503 });
  }

  const parsed = await readJsonBody(request, customerNoteSchema);
  if (parsed.error) {
    return parsed.error;
  }
  const body = parsed.data;

  const { data, error } = await supabase.rpc("add_customer_note_as_admin", {
    customer_uuid: body.customerId,
    note_body: body.body,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const snapshot = await getSupabaseRuntimeSnapshot();

  return NextResponse.json({
    message: typeof data === "string" ? data : "Customer note added.",
    snapshot,
  });
}
