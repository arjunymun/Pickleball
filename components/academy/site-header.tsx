import Link from "next/link";
import { AcademyBrand } from "@/components/academy/brand";

export function SiteHeader() {
  return (
    <header className="academy-header">
      <div className="academy-container academy-header__inner">
        <AcademyBrand />
        <nav className="academy-header__nav" aria-label="Main navigation">
          <Link href="/#courts">The courts</Link>
          <Link href="/membership">Membership</Link>
          <Link href="/#visit">Visit us</Link>
          <Link href="/app">My bookings</Link>
        </nav>
        <div className="academy-header__actions">
          <Link href="/sign-in" className="academy-button-secondary">Sign in</Link>
          <Link href="/book" className="academy-button">Book a court</Link>
        </div>
      </div>
    </header>
  );
}
