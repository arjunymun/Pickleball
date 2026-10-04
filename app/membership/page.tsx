import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { AcademyMembershipPage } from "@/components/customer/academy-membership";
export const metadata = { title: "Membership" };
export default function MembershipPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <AcademyMembershipPage />
      </main>
      <SiteFooter />
    </>
  );
}
