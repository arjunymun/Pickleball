import { SignInPanel } from "@/components/auth/sign-in-panel";
import { getAuthState } from "@/lib/auth";

export const metadata = {
  title: "Sign In",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const [authState, params] = await Promise.all([getAuthState(), searchParams]);
  const errorParam = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="page-frame min-h-screen px-6 pb-20 pt-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <SignInPanel isSupabaseConfigured={authState.isConfigured} initialError={errorParam ?? null} />
      </div>
    </main>
  );
}
