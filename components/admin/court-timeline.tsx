"use client";
import type { AcademyBlock, AcademyBooking, AcademyCourt, AdminSchedulePayload } from "@/lib/academy/contracts";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import { slotStart } from "@/lib/academy/time";
import { displayStatus, sourceLabels } from "./operations-utils";
import styles from "./operations.module.css";

const hours = Array.from({ length: ACADEMY.closingHour - ACADEMY.openingHour }, (_, index) => ACADEMY.openingHour + index);
interface CourtTimelineProps {
  payload: AdminSchedulePayload;
  date: string;
  courts: AcademyCourt[];
  locked: boolean;
  onBooking: (booking: AcademyBooking) => void;
  onBlock: (block: AcademyBlock) => void;
  onOpen: (courtId: string, hour: number) => void;
  now: number;
}
export function CourtTimeline({ payload, date, courts, locked, onBooking, onBlock, onOpen, now }: CourtTimelineProps) {
  return <div className={styles.timelineScroll} tabIndex={0} aria-label="Hourly schedule; scroll horizontally to see every court">
        <div className={styles.timeline} role="table" aria-label={`Reservations for ${date}`} aria-busy={locked} style={{ gridTemplateColumns: `68px repeat(${courts.length}, minmax(160px, 1fr))`, minWidth: courts.length > 1 ? 720 : 240 }}>
          <div className={styles.timelineRow} role="row"><div className={styles.timelineCorner} role="columnheader">IST</div>{courts.map((court) => <div className={styles.courtHeading} role="columnheader" key={court.id}><span>0{court.number}</span>{court.name}</div>)}</div>
          {hours.map((hour) => <div className={styles.timelineRow} role="row" key={hour}><div className={styles.hour} role="rowheader">{String(hour).padStart(2, "0")}:00</div>{courts.map((court) => {
            const start = new Date(slotStart(date, hour)).getTime();
            const end = start + 3_600_000;
            const bookings = payload.bookings.filter((booking) => booking.courtId === court.id && new Date(booking.startsAt).getTime() < end && new Date(booking.endsAt).getTime() > start);
            const blocks = payload.blocks.filter((block) => block.courtId === court.id && new Date(block.startsAt).getTime() < end && new Date(block.endsAt).getTime() > start);
            const active = bookings.some((booking) => ["held", "confirmed", "checked_in", "completed", "no_show"].includes(booking.status));
            const past = end <= now;
            return <div className={styles.cell} key={`${court.id}-${hour}`} role="cell">{bookings.map((booking) => <button type="button" key={booking.id} disabled={locked} className={`${styles.reservation} ${booking.status === "held" ? styles.held : ["cancelled", "expired", "no_show", "completed"].includes(booking.status) ? styles.finished : styles.confirmed}`} onClick={() => onBooking(booking)}><strong>{booking.customerName}</strong><span>{displayStatus(booking.status)} · {sourceLabels[booking.source]}</span><small>{formatMoney(booking.amountPaise)} · {displayStatus(booking.paymentStatus)}</small></button>)}{blocks.map((block) => <button type="button" key={block.id} disabled={locked} className={`${styles.reservation} ${styles.blocked}`} onClick={() => onBlock(block)}><strong>Maintenance</strong><span>{block.reason}</span></button>)}{!active && blocks.length === 0 && <button type="button" className={styles.openSlot} disabled={past || locked} onClick={() => onOpen(court.id, hour)} aria-label={`Add reservation on ${court.name} at ${hour}:00 on ${date}`}>{past ? "Elapsed" : "+ Add"}</button>}</div>;
          })}</div>)}
        </div>
      </div>;
}
