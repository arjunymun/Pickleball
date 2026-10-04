import { ACADEMY, formatMoney } from "@/lib/academy/config";
import styles from "@/components/admin/operations.module.css";
export default function ClubRulesPage() {
  const rules = [
    ["Courts", `${ACADEMY.courtCount} outdoor courts · ${ACADEMY.location}`],
    ["Opening hours", "Every day, 6:00 am–midnight · Asia/Kolkata"],
    ["Court reservations", `One hour · ${formatMoney(ACADEMY.courtPricePaise)} per court · ${formatMoney(ACADEMY.memberCourtPricePaise)} for an active, paid member`],
    ["Booking window", `${ACADEMY.bookingWindowDays} calendar days · ${ACADEMY.holdMinutes}-minute checkout hold`],
    ["Individual play", `${formatMoney(ACADEMY.individualPricePaise)} per person-hour, arranged in person. Staff reserve the court separately.`],
    ["Monthly membership", `${formatMoney(ACADEMY.membershipPricePaise)} per month, renewed automatically. Includes one individual hour per day; staff record each visit. No banked hours or free court reservations.`],
    ["Cancellations", `Players call ${ACADEMY.phone}. Staff record the cancellation reason and no, full or partial refund. Gateway refunds must be verified.`],
    ["External platforms", "Playo, Hudle and District reservations are entered manually with the platform reference. There is no automatic platform synchronization."],
  ];
  return <><div className={styles.pageHeading}><div><p className="academy-eyebrow">Club rules</p><h1>How the academy runs.</h1><p>Current operating rules used by the booking service.</p></div></div><dl className={styles.rules}>{rules.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl><section className={styles.notePanel}><h2>Change an operating rule</h2><p>Price, opening hours and membership changes need an owner-reviewed service update. Existing reservations keep their recorded price. This screen shows the active rules; it does not apply configuration changes.</p></section></>;
}
