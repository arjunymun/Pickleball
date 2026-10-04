import { createClient } from "@supabase/supabase-js";

import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/supabase/env";
import { boundedSupabaseFetch } from "@/lib/supabase/fetch";

export function createSupabaseAdminClient() {
  const env = getSupabasePublicEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!env || !serviceRoleKey) {
    return null;
  }

  return createClient(env.url, serviceRoleKey, {
    global: { fetch: boundedSupabaseFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
