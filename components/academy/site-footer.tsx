import Link from "next/link";
import { ACADEMY } from "@/lib/academy/config";

export function SiteFooter() {
  return (
    <footer className="academy-footer">
      <div className="academy-container">
        <div className="academy-footer__top">
          <div className="academy-footer__contact">
            <strong>{ACADEMY.name}</strong><span>{ACADEMY.location}</span>
            <a href={ACADEMY.phoneHref}>{ACADEMY.phone}</a>
          </div>
          <nav className="academy-footer__links" aria-label="Footer navigation">
            <Link href="/contact">Contact</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/demo">Project walkthrough</Link>
          </nav>
        </div>
        <div className="academy-footer__bottom"><span>Four courts. More reasons to play.</span><span>© {new Date().getFullYear()} {ACADEMY.name}</span></div>
      </div>
    </footer>
  );
}
