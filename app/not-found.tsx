import Link from "next/link";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container academy-empty">
        <p className="academy-eyebrow">404 · Page not found</p>
        <h1 className="academy-heading">Let&apos;s get you back on court.</h1>
        <p>
          This link may have changed. Find a court or return to the academy home
          page.
        </p>
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}
        >
          <Link className="academy-button" href="/book">
            Find a court
          </Link>
          <Link className="academy-button-secondary" href="/">
            Academy home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
