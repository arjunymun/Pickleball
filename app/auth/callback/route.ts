import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function signInError(origin: string, error: string) {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/app";
  const redirectUrl = new URL(next, requestUrl.origin);

  // Previously these failure paths silently landed the user on /app unauthenticated.
  // Surface a clear reason on /sign-in instead so the dead-end is debuggable.
  if (!isSupabaseConfigured()) {
    return signInError(requestUrl.origin, "supabase_not_configured");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return signInError(requestUrl.origin, "client_init_failed");
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return signInError(requestUrl.origin, error.message);
    }
  }

  return NextResponse.redirect(redirectUrl);
}
