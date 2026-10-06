"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowUpRight, Moon, Sun, MoveUpRight } from "lucide-react";
import { ACADEMY } from "@/lib/academy/config";
import type { AcademyCourt } from "@/lib/academy/contracts";
import { useCustomerData } from "../customer/customer-data";
import type { CourtView } from "./court-canvas";
import styles from "./court-explorer.module.css";

const CourtCanvas = dynamic(() => import("./court-canvas"), { ssr: false });
const VIEWS: { value: CourtView; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "overhead", label: "From above" },
  { value: "courtside", label: "Courtside" },
];

export function CourtExplorer() {
  const [night, setNight] = useState(true);
  const [court, setCourt] = useState(0);
  const [view, setView] = useState<CourtView>("overview");
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const reducedMotion = useReducedMotion();
  const markReady = useCallback(() => setReady(true), []);
  const markUnavailable = useCallback(() => setUnavailable(true), []);
  const courtData = useCustomerData<{ courts: AcademyCourt[] }>("/api/courts");
  const selected = courtData.data?.courts.find(
    (item) => item.number === court + 1,
  );
  const bookingHref = selected
    ? `/book?court=${encodeURIComponent(selected.id)}`
    : "/book";
  return (
    <section
      className={styles.explorer}
      aria-label="Interactive court explorer"
    >
      <div className={styles.topline}>
        <span>Explore the blue</span>
        <span>Dehradun · 4 outdoor courts</span>
      </div>
      <div className={styles.stage} data-ready={ready && !unavailable}>
        <div className={styles.poster}>
          <Image
            src={ACADEMY.photos.courts}
            quality={90}
            alt="Doon Pickleball Academy outdoor courts"
            fill
            sizes="100vw"
            loading="eager"
          />
        </div>
        {!unavailable && (
          <CourtCanvas
            night={night}
            court={court}
            view={view}
            reducedMotion={reducedMotion !== false}
            onReady={markReady}
            onUnavailable={markUnavailable}
          />
        )}
        <div className={styles.stageLabel}>
          <span>
            {!ready || unavailable || night
              ? "Under the lights"
              : "In the daylight"}
          </span>
          <strong>
            {view === "courtside" ? `Court 0${court + 1}` : "Room to play."}
          </strong>
        </div>
        <p className={styles.modelNote}>
          {unavailable
            ? "Academy photography"
            : "Interactive court schematic · not live availability"}
        </p>
        <div className={styles.views} role="group" aria-label="Camera view">
          {VIEWS.map((item) => (
            <button
              key={item.value}
              aria-pressed={view === item.value}
              disabled={unavailable}
              onClick={() => setView(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.controls}>
        <div
          className={styles.courts}
          role="group"
          aria-label="Explore a court"
        >
          <span>Your court</span>
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              aria-label={`Explore Court ${index + 1}`}
              aria-pressed={court === index}
              onClick={() => setCourt(index)}
            >
              0{index + 1}
            </button>
          ))}
        </div>
        <div
          className={styles.lighting}
          role="group"
          aria-label="Court lighting"
        >
          <button aria-pressed={!night} onClick={() => setNight(false)}>
            <Sun size={16} />
            Day
          </button>
          <button aria-pressed={night} onClick={() => setNight(true)}>
            <Moon size={16} />
            Night
          </button>
        </div>
        <Link className={styles.booking} href={bookingHref}>
          {selected ? `Check Court ${court + 1}` : "Check availability"}
          <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className={styles.caption}>
        <span>
          <MoveUpRight size={14} /> Change your perspective. Then make your next
          game happen.
        </span>
        <span>6 AM – midnight, every day</span>
      </div>
    </section>
  );
}
