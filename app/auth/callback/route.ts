import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/app";
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(redirectUrl);
}
