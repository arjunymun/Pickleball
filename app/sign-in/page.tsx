import { redirect } from "next/navigation";

import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getAuthState } from "@/lib/auth";

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage() {
  const authState = await getAuthState();

  if (authState.user) {
    redirect(authState.user.hasAdminAccess ? "/admin" : "/app");
  }

  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <SignInPanel isSupabaseConfigured={authState.isConfigured} />
      </div>
    </main>
  );
}
