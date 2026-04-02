"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error("Supabase environment variables are missing.");
  }

  browserClient = createBrowserClient(env.url, env.anonKey);

  return browserClient;
}
