import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { safeReturnPath } from "@/components/auth/safe-return";
import { getAcademySession } from "@/lib/academy/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in", robots: { index: false } };
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const next = safeReturnPath(params.next);
  const session = await getAcademySession().catch(() => null);
  if (session?.user) redirect(next);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <SignInPanel
          next={next}
          initialError={
            Array.isArray(params.error) ? params.error[0] : params.error
          }
          configured={session?.configured ?? false}
          emailConfigured={process.env.ACADEMY_EMAIL_AUTH_ENABLED === "true"}
        />
      </main>
      <SiteFooter />
    </>
  );
}
