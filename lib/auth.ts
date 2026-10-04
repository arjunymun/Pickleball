import { getAcademySession } from "@/lib/academy/server";

// Compatibility for old display components. Real authorization uses AcademySession.
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
  const session = await getAcademySession();
  return {
    backendMode: "supabase",
    isConfigured: session.configured,
    setupStatus: !session.configured
      ? "signed_out"
      : session.user
        ? "live"
        : "signed_out",
    user: session.user
      ? {
          email: session.user.email,
          phone: null,
          fullName: session.user.name,
          primaryRole: session.user.role,
          hasAdminAccess: ["staff", "owner"].includes(session.user.role),
        }
      : null,
  };
}
