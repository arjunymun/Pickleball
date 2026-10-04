import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv, isAcademyConfigured } from "@/lib/supabase/env";
import { boundedSupabaseFetch } from "@/lib/supabase/fetch";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const env = getSupabasePublicEnv();
  if (
    !env ||
    !isAcademyConfigured() ||
    !request.cookies
      .getAll()
      .some(
        (cookie) =>
          cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
      )
  )
    return response;
  const supabase = createServerClient(env.url, env.anonKey, {
    global: { fetch: boundedSupabaseFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        for (const [name, value] of Object.entries(headers ?? {}))
          response.headers.set(name, value);
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getClaims(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Auth timeout")), 6500);
      }),
    ]);
    if (result.error && result.error.name === "AuthRetryableFetchError")
      response.headers.set("X-Academy-Auth", "unavailable");
  } catch {
    response.headers.set("X-Academy-Auth", "unavailable");
  } finally {
    clearTimeout(timer);
  }
  return response;
}
export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/sign-in",
  ],
};
