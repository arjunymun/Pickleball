import { createClient } from "@supabase/supabase-js";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  isAcademyConfigured,
} from "@/lib/supabase/env";
import { boundedSupabaseFetch } from "@/lib/supabase/fetch";
import type {
  AcademyDatabase,
  DatabaseJson,
} from "@/lib/academy/database-types";
import {
  AcademyError,
  translateDatabaseError,
  unavailable,
} from "@/lib/academy/errors";

export interface AcademyRepository {
  dispatch<T>(
    action: string,
    input?: Record<string, unknown>,
    actor?: string | null,
  ): Promise<T>;
}

export function academyRepository(): AcademyRepository {
  if (!isAcademyConfigured()) throw unavailable();
  const env = getSupabasePublicEnv();
  const key = getSupabaseServiceRoleKey();
  if (!env || !key) throw unavailable();
  const client = createClient<AcademyDatabase>(env.url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: boundedSupabaseFetch },
  });
  return {
    async dispatch<T>(action: string, input = {}, actor = null): Promise<T> {
      try {
        const { data, error } = await client.rpc("academy_dispatch", {
          p_action: action,
          p_input: input as DatabaseJson,
          ...(actor !== null ? { p_actor: actor } : {}),
        });
        if (error) throw translateDatabaseError(error);
        return data as T;
      } catch (error) {
        if (error instanceof AcademyError) throw error;
        throw unavailable();
      }
    },
  };
}
