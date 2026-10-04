import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  MapPin,
  Sun,
  Users,
  LayoutGrid,
  ArrowUpRight,
} from "lucide-react";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import {
  bookingDates,
  formatCourtDate,
  formatCourtTime,
  slotStart,
} from "@/lib/academy/time";
import styles from "@/components/customer/academy-customer.module.css";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const dates = bookingDates();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <section className={styles.hero} aria-labelledby="home-heading">
          <div className={styles.heroCopy}>
            <p className="academy-eyebrow">GMS Road, Dehradun</p>
            <h1
              id="home-heading"
              className={`academy-heading ${styles.heroHeading}`}
            >
              Your next
              <br /> game starts
              <br /> here<span className={styles.dot}>.</span>
            </h1>
            <p className={styles.heroDescription}>
              Four outdoor courts. Good games, every day.
            </p>
          </div>
          <div className={styles.heroPhoto}>
            <Image
              src={ACADEMY.photos.daylight}
              alt="Blue outdoor pickleball courts at Doon Pickleball Academy, Dehradun"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 65vw"
            />
            <span className={styles.photoCaption}>The academy, GMS Road</span>
          </div>
        </section>
        <form
          action="/book"
          className={styles.heroFinder}
          aria-label="Find a court"
        >
          <label className={styles.field}>
            Choose a date
            <select
              className="academy-input"
              name="date"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select date
              </option>
              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatCourtDate(date)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Choose a time
            <select
              className="academy-input"
              name="time"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Select time
              </option>
              {Array.from({ length: 18 }, (_, index) => index + 6).map(
                (hour) => (
                  <option key={hour} value={hour}>
                    {formatCourtTime(slotStart(dates[0], hour))}
                  </option>
                ),
              )}
            </select>
          </label>
          <button type="submit" className="academy-button">
            Find a court
          </button>
        </form>
        <div id="courts" className={styles.facts}>
          <span>
            <LayoutGrid size={23} />4 outdoor courts
          </span>
          <span>
            <Clock3 size={23} />6 AM – midnight
          </span>
          <span>
            <Sun size={25} />
            Floodlit evenings
          </span>
        </div>
        <section className={styles.playSection} aria-labelledby="play-heading">
          <div>
            <h2
              id="play-heading"
              className={`academy-heading ${styles.sectionHeading}`}
            >
              More ways to play.
            </h2>
            <div className={styles.pricingGrid}>
              <Link href="/book" className={styles.priceCard}>
                <LayoutGrid size={26} />
                <h3>Book a court</h3>
                <p className={styles.price}>
                  {formatMoney(ACADEMY.courtPricePaise)}
                  <span> / hour</span>
                </p>
                <p>
                  {formatMoney(ACADEMY.memberCourtPricePaise)} per court-hour
                  for active members.
                </p>
                <span className={styles.cardLink}>
                  Choose a time <ArrowUpRight size={17} />
                </span>
              </Link>
              <a href={ACADEMY.phoneHref} className={styles.priceCard}>
                <Users size={26} />
                <h3>Drop in &amp; play</h3>
                <p className={styles.price}>
                  {formatMoney(ACADEMY.individualPricePaise)}
                  <span> / person / hour</span>
                </p>
                <p>
                  Individual play, paid at the academy. Call to check space.
                </p>
                <span className={styles.cardLink}>
                  Call the academy <ArrowUpRight size={17} />
                </span>
              </a>
              <Link href="/membership" className={styles.priceCard}>
                <Sun size={27} />
                <h3>Become a member</h3>
                <p className={styles.price}>
                  {formatMoney(ACADEMY.membershipPricePaise)}
                  <span> / month</span>
                </p>
                <p>
                  One individual hour every day. Automatically renews monthly.
                </p>
                <span className={styles.cardLink}>
                  See membership <ArrowUpRight size={17} />
                </span>
              </Link>
            </div>
          </div>
          <div className={styles.eveningPhoto}>
            <Image
              src={ACADEMY.photos.evening}
              alt="The academy's blue courts under evening floodlights"
              fill
              sizes="(max-width: 900px) 100vw, 30vw"
            />
          </div>
        </section>
        <section id="visit" className={styles.visitStrip}>
          <div>
            <p className="academy-eyebrow">Come play</p>
            <h2 className={`academy-heading ${styles.sectionHeading}`}>
              See you on court.
            </h2>
            <p>
              <MapPin size={18} />
              {ACADEMY.address}
            </p>
          </div>
          <div className={styles.actionRow}>
            <a
              href={ACADEMY.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="academy-button-secondary"
            >
              Get directions <ArrowUpRight size={17} />
            </a>
            <a href={ACADEMY.phoneHref} className="academy-button-secondary">
              {ACADEMY.phone}
            </a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
