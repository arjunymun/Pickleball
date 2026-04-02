import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AuthState {
  backendMode: "demo" | "supabase";
  isConfigured: boolean;
  user: {
    email: string | null;
    fullName: string | null;
  } | null;
}

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      backendMode: "demo",
      isConfigured: false,
      user: null,
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      backendMode: "demo",
      isConfigured: false,
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    backendMode: "supabase",
    isConfigured: true,
    user: user
      ? {
          email: user.email ?? null,
          fullName:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : typeof user.user_metadata?.name === "string"
                ? user.user_metadata.name
                : null,
        }
      : null,
  };
}
