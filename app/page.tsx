import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  LayoutGrid,
  MapPin,
  Sun,
  Users,
  ArrowDown,
} from "lucide-react";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { CourtExperience } from "@/components/academy/court-experience";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import {
  bookingDates,
  formatCourtDate,
  formatCourtTime,
  slotStart,
} from "@/lib/academy/time";
import styles from "@/components/academy/home.module.css";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const dates = bookingDates();
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className={styles.hero} aria-labelledby="home-heading">
          <div className={`academy-container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className={styles.location}>
                <MapPin size={16} /> GMS Road, Dehradun
              </p>
              <h1 id="home-heading">
                Meet you
                <br />
                on court.
              </h1>
              <p className={styles.heroDescription}>
                A little competition. A lot of good company.
                <br />
                Your next game starts at Doon.
              </p>
              <div className={styles.heroActions}>
                <Link href="/book" className={styles.heroButton}>
                  Find your court <ArrowUpRight size={21} />
                </Link>
                <a href="#courts" className={styles.exploreLink}>
                  Explore the academy <ArrowDown size={17} />
                </a>
              </div>
              <div className={styles.heroNote}>
                <span /> Four outdoor courts, open every day
              </div>
            </div>
            <div className={styles.heroArt}>
              <CourtExperience />
            </div>
          </div>
          <div className={styles.heroWordmark} aria-hidden="true">
            PLAY A LITTLE MORE.
          </div>
        </section>
        <div className={`academy-container ${styles.finderWrap}`}>
          <form
            action="/book"
            className={styles.finder}
            aria-label="Find a court"
          >
            <div className={styles.finderTitle}>
              <LayoutGrid size={24} />
              <div>
                <strong>Make time for a game.</strong>
                <span>One hour. Your court. Your crew.</span>
              </div>
            </div>
            <label>
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
            <label>
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
                {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => (
                  <option key={hour} value={hour}>
                    {formatCourtTime(slotStart(dates[0], hour))}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="academy-button">
              Check availability <ArrowUpRight size={18} />
            </button>
          </form>
        </div>
        <section
          id="courts"
          className={`academy-container ${styles.venue}`}
          aria-labelledby="venue-heading"
        >
          <div className={styles.sectionIntro}>
            <h2 id="venue-heading">
              Fresh air.
              <br />
              Full-court energy.
            </h2>
            <p>
              Come for a quick rally. Stay for the next one. Four blue outdoor
              courts, with floodlights that keep the game going long after
              sunset.
            </p>
          </div>
          <div className={styles.venuePhoto}>
            <Image
              src={ACADEMY.photos.daylight}
              alt="The four blue outdoor courts at Doon Pickleball Academy surrounded by Dehradun greenery"
              fill
              sizes="(max-width:700px) 100vw, 90vw"
              priority
            />
            <div className={styles.photoBottom}>
              <span>
                <MapPin size={17} /> Your local court, GMS Road
              </span>
              <a
                href={ACADEMY.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Find us <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
          <div className={styles.facts}>
            <div>
              <LayoutGrid size={23} />
              <strong>4 courts</strong>
              <span>Room for your whole crew</span>
            </div>
            <div>
              <Clock3 size={23} />
              <strong>6 AM – midnight</strong>
              <span>Early starts. Late rallies.</span>
            </div>
            <div>
              <Sun size={25} />
              <strong>Play under the lights</strong>
              <span>The evening game is on</span>
            </div>
          </div>
        </section>
        <section className={styles.playSection} aria-labelledby="play-heading">
          <div className="academy-container">
            <div className={styles.sectionIntro}>
              <h2 id="play-heading">
                Find your
                <br />
                kind of game.
              </h2>
              <p>
                Bring your friends, meet someone across the net, or make the
                academy part of your daily routine.
              </p>
            </div>
            <div className={styles.pricing}>
              <Link
                href="/book"
                className={`${styles.priceCard} ${styles.courtCard}`}
              >
                <div className={styles.cardIcon}>
                  <LayoutGrid size={28} />
                </div>
                <h3>
                  Your court.
                  <br />
                  Your game.
                </h3>
                <p>One court for your group, for one hour.</p>
                <div className={styles.price}>
                  {formatMoney(ACADEMY.courtPricePaise)}
                  <span>/ hour</span>
                </div>
                <p className={styles.priceDetail}>
                  {formatMoney(ACADEMY.memberCourtPricePaise)} for active
                  members
                </p>
                <div className={styles.cardAction}>
                  Book a court <ArrowUpRight size={22} />
                </div>
              </Link>
              <a href={ACADEMY.phoneHref} className={styles.priceCard}>
                <div className={styles.cardIcon}>
                  <Users size={28} />
                </div>
                <h3>
                  Just show up.
                  <br />
                  Get a rally going.
                </h3>
                <p>Individual play, arranged at the academy.</p>
                <div className={styles.price}>
                  {formatMoney(ACADEMY.individualPricePaise)}
                  <span>/ person / hour</span>
                </div>
                <p className={styles.priceDetail}>Call ahead to check space</p>
                <div className={styles.cardAction}>
                  Call to play <ArrowUpRight size={22} />
                </div>
              </a>
              <Link
                href="/membership"
                className={`${styles.priceCard} ${styles.memberCard}`}
              >
                <div className={styles.cardIcon}>
                  <Sun size={28} />
                </div>
                <h3>
                  A daily game.
                  <br />A better routine.
                </h3>
                <p>One hour of individual play every day.</p>
                <div className={styles.price}>
                  {formatMoney(ACADEMY.membershipPricePaise)}
                  <span>/ month</span>
                </div>
                <p className={styles.priceDetail}>
                  Monthly renewal · member court rates
                </p>
                <div className={styles.cardAction}>
                  Explore membership <ArrowUpRight size={22} />
                </div>
              </Link>
            </div>
          </div>
        </section>
        <section className={`academy-container ${styles.evening}`}>
          <div className={styles.eveningPhoto}>
            <Image
              src={ACADEMY.photos.evening}
              alt="Academy courts illuminated by floodlights for an evening game"
              fill
              sizes="(max-width:700px) 100vw, 55vw"
            />
          </div>
          <div className={styles.eveningCopy}>
            <Sun size={32} />
            <h2>
              The day ends.
              <br />
              The game doesn’t.
            </h2>
            <p>
              Trade screen time for court time. From the first morning serve to
              the last evening rally, there’s a place for you here.
            </p>
            <Link href="/book" className="academy-button">
              Plan your next game <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
        <section id="visit" className={`academy-container ${styles.visit}`}>
          <div>
            <p className={styles.visitLocation}>
              <MapPin size={17} /> GMS Road, Dehradun
            </p>
            <h2>
              See you
              <br />
              on the blue.
            </h2>
            <p>{ACADEMY.address}</p>
          </div>
          <div className={styles.visitActions}>
            <a
              href={ACADEMY.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="academy-button"
            >
              Get directions <ArrowUpRight size={18} />
            </a>
            <a href={ACADEMY.phoneHref} className={styles.phoneLink}>
              {ACADEMY.phone}
            </a>
            <span>Open every day, 6 AM – midnight</span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
