import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

type PortfolioAccountPayload = {
  email?: string;
  password?: string;
  redirectTo?: string;
  error?: string;
};

export async function GET(request: NextRequest) {
  const env = getSupabasePublicEnv();
  const role = request.nextUrl.searchParams.get("role") === "operator" ? "operator" : "customer";
  const fallbackRedirect = role === "operator" ? "/admin" : "/app/bookings";

  if (!env) {
    return NextResponse.redirect(new URL("/sign-in?error=supabase_missing", request.url));
  }

  const accountResponse = await fetch(new URL("/api/portfolio/live-account", request.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role }),
    cache: "no-store",
  });
  const accountPayload = (await accountResponse.json()) as PortfolioAccountPayload;

  if (!accountResponse.ok || !accountPayload.email || !accountPayload.password) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("error", accountPayload.error ?? "portfolio_login_failed");
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.redirect(new URL(accountPayload.redirectTo ?? fallbackRedirect, request.url));
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.redirect(new URL(accountPayload.redirectTo ?? fallbackRedirect, request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({
    email: accountPayload.email,
    password: accountPayload.password,
  });

  if (error) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
