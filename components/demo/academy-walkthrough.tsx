"use client";

import { useState } from "react";
import { ArrowRight, Check, RotateCcw, ShieldCheck } from "lucide-react";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import styles from "@/components/demo/walkthrough.module.css";

type SampleStatus = "available" | "held" | "confirmed" | "checked_in" | "completed";

export function AcademyWalkthrough() {
  const [court, setCourt] = useState(1);
  const [member, setMember] = useState(false);
  const [status, setStatus] = useState<SampleStatus>("available");
  const [events, setEvents] = useState<string[]>([]);
  const price = member ? ACADEMY.memberCourtPricePaise : ACADEMY.courtPricePaise;
  function advance(next: SampleStatus, message: string) {
    setStatus(next);
    setEvents((previous) => [...previous, message]);
  }
  function reset() { setStatus("available"); setEvents([]); }
  return (
    <section className={styles.sandbox} aria-labelledby="sandbox-title">
      <div className={styles.intro}><div><p className="academy-eyebrow">Isolated interactive example</p><h2 id="sandbox-title" className="academy-heading">Follow one court booking.</h2></div><span className={styles.badge}><ShieldCheck size={16} /> Sample data only</span></div>
      <p className="academy-muted">This example runs entirely in this page. It creates no real reservation, account, payment, or staff access. Refreshing clears it.</p>
      <div className={styles.grid}>
        <div>
          <div className={styles.courts} aria-label="Sample courts">
            {[1, 2, 3, 4].map((number) => (
              <button key={number} className={`${styles.court} ${number === court ? styles.selected : ""}`} aria-pressed={number === court} disabled={status !== "available"} onClick={() => setCourt(number)}>
                <span className={styles.courtLines} aria-hidden="true" /><strong>Court {number}</strong><span>{number === court ? status.replaceAll("_", " ") : "Available"}</span>
              </button>
            ))}
          </div>
          <label className={styles.member}><input type="checkbox" checked={member} disabled={status !== "available"} onChange={(event) => setMember(event.target.checked)} /> Sample active membership</label>
        </div>
        <div className={styles.detail}>
          <p className="academy-eyebrow">Sample player · 7–8 PM · one hour</p><h3 className="academy-heading">Court {court}</h3><strong className={styles.price}>{formatMoney(price)}</strong><p className={styles.status} aria-live="polite">{status.replaceAll("_", " ")}</p>
          {status === "available" ? <button className="academy-button" onClick={() => advance("held", "Ten-minute hold created; inventory reserved and total locked.")}>Create sample hold <ArrowRight size={18} /></button> : null}
          {status === "held" ? <button className="academy-button" onClick={() => advance("confirmed", "Sample captured payment verified; booking confirmed once.")}>Simulate verified payment <ArrowRight size={18} /></button> : null}
          {status === "confirmed" ? <button className="academy-button" onClick={() => advance("checked_in", "Staff checked in the sample player; court remains occupied.")}>Sample staff check-in <Check size={18} /></button> : null}
          {status === "checked_in" ? <button className="academy-button" onClick={() => advance("completed", "Session completed; reservation and payment history retained.")}>Complete sample session <Check size={18} /></button> : null}
          {status === "completed" ? <p className={styles.done}><Check size={20} /> Sample journey complete.</p> : null}
          <button className={styles.reset} onClick={reset}><RotateCcw size={16} /> Reset example</button>
        </div>
      </div>
      {events.length > 0 ? <ol className={styles.events} aria-label="Sample event history">{events.map((event, index) => <li key={index}><Check size={16} />{event}</li>)}</ol> : null}
    </section>
  );
}
