import Image from "next/image";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { ACADEMY } from "@/lib/academy/config";
import styles from "@/components/customer/academy-customer.module.css";

export const metadata = { title: "Visit & contact" };
export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <article className={styles.document}>
          <h1 className="academy-heading">See you on court.</h1>
          <div className={styles.venuePhoto}>
            <Image
              src={ACADEMY.photos.reverse}
              alt="The academy's four outdoor pickleball courts in Dehradun"
              fill
              sizes="(max-width:700px) 100vw, 740px"
            />
          </div>
          <h2 className="academy-heading">Visit the academy</h2>
          <p>{ACADEMY.address}</p>
          <p>
            Open every day, 6 AM to midnight. All opening and booking times are
            India Standard Time.
          </p>
          <div className={styles.actionRow}>
            <a
              href={ACADEMY.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="academy-button"
            >
              Get directions
            </a>
            <a href={ACADEMY.phoneHref} className="academy-button-secondary">
              Call {ACADEMY.phone}
            </a>
          </div>
          <h2 className="academy-heading">
            Bookings, cancellations &amp; questions
          </h2>
          <p>
            Call the academy for individual-play availability, booking
            cancellations, membership questions or help with a payment. For a
            booking query, have your booking reference ready.
          </p>
          <p>
            Individual play is arranged in person, subject to court space.
            Private court bookings can be made online when availability and
            checkout are enabled.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
