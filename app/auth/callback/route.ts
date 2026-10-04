import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/academy/auth-path";
import { getAcademySession } from "@/lib/academy/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAcademyConfigured } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeReturnPath(url.searchParams.get("next"));
  function failure(code: string) {
    const target = new URL("/sign-in", url.origin);
    target.searchParams.set("error", code);
    target.searchParams.set("next", next);
    const response = NextResponse.redirect(target);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (!isAcademyConfigured()) return failure("booking_unavailable");
  const client = await createServerSupabaseClient();
  if (!client) return failure("booking_unavailable");
  try {
    const code = url.searchParams.get("code");
    const token = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) return failure("link_expired");
    } else if (token && (type === "email" || type === "magiclink")) {
      const { error } = await client.auth.verifyOtp({
        token_hash: token,
        type,
      });
      if (error) return failure("link_expired");
    } else return failure("link_expired");
    const session = await getAcademySession();
    if (!session.user) return failure("sign_in_failed");
    const response = NextResponse.redirect(new URL(next, url.origin));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return failure("booking_unavailable");
  }
}
