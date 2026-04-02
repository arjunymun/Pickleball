import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface AuthState {
  backendMode: "demo" | "supabase";
  isConfigured: boolean;
  setupStatus: "demo" | "signed_out" | "needs_bootstrap" | "live";
  user: {
    email: string | null;
    phone: string | null;
    fullName: string | null;
    primaryRole: "guest" | "customer" | "staff" | "owner";
    hasAdminAccess: boolean;
  } | null;
}

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return {
      backendMode: "demo",
      isConfigured: false,
      setupStatus: "demo",
      user: null,
    };
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return {
      backendMode: "demo",
      isConfigured: false,
      setupStatus: "demo",
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      backendMode: "supabase",
      isConfigured: true,
      setupStatus: "signed_out",
      user: null,
    };
  }

  const { data: appUserRow } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const appUserId = typeof appUserRow?.id === "string" ? appUserRow.id : null;

  const [{ data: customerProfiles }, { data: adminRoles }] = await Promise.all([
    appUserId ? supabase.from("customer_profiles").select("venue_id").eq("user_id", appUserId) : Promise.resolve({ data: [] }),
    appUserId ? supabase.from("admin_roles").select("kind, venue_id").eq("user_id", appUserId) : Promise.resolve({ data: [] }),
  ]);

  const primaryRole =
    adminRoles?.some((role) => role.kind === "owner")
      ? "owner"
      : adminRoles?.some((role) => role.kind === "staff")
        ? "staff"
        : customerProfiles && customerProfiles.length > 0
          ? "customer"
          : "guest";

  const activeVenueId =
    adminRoles?.find((role) => role.kind === "owner")?.venue_id ??
    adminRoles?.find((role) => role.kind === "staff")?.venue_id ??
    customerProfiles?.[0]?.venue_id ??
    null;

  return {
    backendMode: "supabase",
    isConfigured: true,
    setupStatus: activeVenueId ? "live" : "needs_bootstrap",
    user: {
      email: user.email ?? null,
      phone: user.phone ?? (typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : null),
      fullName:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : null,
      primaryRole,
      hasAdminAccess: primaryRole === "owner" || primaryRole === "staff",
    },
  };
}
