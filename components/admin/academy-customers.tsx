"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { academyFetch, academyPost } from "@/lib/academy/client";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import type { AcademyAttendance, AcademyCustomer, AdminCustomersPayload } from "@/lib/academy/contracts";
import { formatCourtDate, formatCourtTime, indiaDate } from "@/lib/academy/time";
import { OperationsDialog } from "./operations-dialog";
import { paidMember, requestKey } from "./operations-utils";
import styles from "./operations.module.css";

export function AcademyCustomers() {
  const [customers, setCustomers] = useState<AcademyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<AcademyCustomer | null>(null);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError("");
    try {
      const result = await academyFetch<AdminCustomersPayload>("/api/admin/customers");
      if (version === requestVersion.current) setCustomers(result.customers);
    } catch (failure) { if (version === requestVersion.current) setError(failure instanceof Error ? failure.message : "Unable to load players."); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { requestVersion.current += 1; }; }, [load]);
  const query = search.trim().toLowerCase();
  const visible = customers.filter((customer) => [customer.name, customer.email, customer.phone ?? ""].some((value) => value.toLowerCase().includes(query)));
  async function saved(message: string) { setSelected(null); setNotice(message); await load(); }
  return <><div className={styles.pageHeading}><div><p className="academy-eyebrow">Front desk · players</p><h1>Players & attendance.</h1><p>Find a player, record a member visit, leave a useful note.</p></div><button type="button" className="academy-button-secondary" disabled={loading} onClick={() => void load()}>Refresh</button></div>
    <section className={styles.membershipInfo}><div><h2>One daily individual hour.</h2><p>{formatMoney(ACADEMY.membershipPricePaise)} / month · only active, paid members qualify. Each visit is recorded once per IST day.</p></div><p>A ₹0 member individual reservation records attendance automatically. Record group participants here. Members&apos; regular court bookings cost {formatMoney(ACADEMY.memberCourtPricePaise)}.</p></section>
    {notice && <p className={styles.success} role="status">{notice}</p>}{error && <div className="academy-alert" role="alert">{error}<p>Player records may be out of date. Refresh before taking action.</p></div>}
    <div className={styles.rosterToolbar}><label>Search registered players<input className="academy-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or phone" /></label><span role="status">{loading ? "Loading players…" : `${visible.length} ${visible.length === 1 ? "player" : "players"}`}</span></div>
    <div className={styles.roster}>{visible.map((customer) => {
      const active = paidMember(customer.membership);
      const attended = customer.attendance.find((entry) => entry.date === indiaDate());
      return <article className={styles.player} key={customer.id}><div><h2>{customer.name}</h2><p>{customer.email}</p>{customer.phone && <p>{customer.phone}</p>}</div><div className={styles.playerMembership}><span className={`${styles.badge} ${active ? styles.memberBadge : ""}`}>{active ? "Paid member" : customer.membership ? customer.membership.status.replaceAll("_", " ") : "No membership"}</span>{customer.membership?.paidThrough && <p>Paid through {formatCourtDate(customer.membership.paidThrough)}</p>}<p>{attended ? `Today's visit: ${formatCourtTime(attended.checkedInAt)}` : "No member visit recorded today"}</p></div><button className="academy-button-secondary" type="button" disabled={loading || Boolean(error)} onClick={() => setSelected(customer)}>Player details</button></article>;
    })}</div>
    {!loading && !error && visible.length === 0 && <div className={styles.empty}><h2>{query ? "No players match your search." : "No registered players yet."}</h2><p>{query ? "Try a name, email address or phone number." : "Players appear here after signing in to the academy."}</p></div>}
    {selected && <PlayerDetails key={selected.id} customer={selected} onClose={() => setSelected(null)} onSaved={saved} />}
  </>;
}

function PlayerDetails({ customer, onClose, onSaved }: { customer: AcademyCustomer; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [note, setNote] = useState(customer.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef<{ signature: string; key: string } | null>(null);
  const today = indiaDate();
  const attended = customer.attendance.find((entry) => entry.date === today);
  const active = paidMember(customer.membership);
  async function saveNote() {
    setBusy(true); setError("");
    try { if (!note.trim()) throw new Error("Write a note before saving."); await academyPost<{ ok: true }>(`/api/admin/customers/${customer.id}/notes`, { body: note.trim() }); await onSaved(`Staff note saved for ${customer.name}.`); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to save this note."); }
    finally { setBusy(false); }
  }
  async function attendance() {
    setBusy(true); setError("");
    try {
      const body = { customerId: customer.id, date: today };
      await academyPost<{ attendance: AcademyAttendance }>("/api/admin/attendance", { ...body, idempotencyKey: requestKey(retry, body) });
      await onSaved(`${customer.name}'s individual member hour recorded for ${formatCourtDate(today)}.`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to record attendance."); }
    finally { setBusy(false); }
  }
  return <OperationsDialog title="Player details" onClose={onClose} dismissDisabled={busy}><p className={styles.detailName}>{customer.name}</p><p className={styles.detailSubtitle}>{customer.email}{customer.phone ? ` · ${customer.phone}` : ""}</p><section className={styles.notePanel}><h3>Membership</h3><p>{active ? "Active, paid membership" : customer.membership ? `Membership ${customer.membership.status.replaceAll("_", " ")}` : "No membership"}</p>{customer.membership?.paidThrough && <p>Paid through {formatCourtDate(customer.membership.paidThrough)} IST.{customer.membership.cancelAtPeriodEnd ? " Ends after this paid period." : ""}</p>}<p>{formatMoney(ACADEMY.membershipPricePaise)} monthly · one individual hour daily. No unused hours carry over; court bookings are {formatMoney(ACADEMY.memberCourtPricePaise)}.</p><button className="academy-button" type="button" disabled={busy || !active || Boolean(attended)} onClick={() => void attendance()}>{attended ? "Today's member visit recorded" : busy ? "Saving…" : "Record today's member hour"}</button>{!active && <p className={styles.helper}>A verified paid membership is required. Staff cannot activate membership without payment.</p>}<p className={styles.helper}>Record a player joining an existing group session when they arrive. This consumes today&apos;s included hour and does not reserve another court. A ₹0 member reservation already records attendance automatically.</p></section>
    {customer.attendance.length > 0 && <section className={styles.attendanceHistory}><h3>Recent member visits</h3><ul>{customer.attendance.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map((entry) => <li key={entry.id}><span>{formatCourtDate(entry.date)}</span><span>{formatCourtTime(entry.checkedInAt)} IST</span></li>)}</ul></section>}
    <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void saveNote(); }}><label>Staff note<textarea className="academy-input" rows={5} required maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></label><p className={styles.helper}>Use practical details for the front desk. Notes are visible only to authorized staff.</p>{error && <p className="academy-alert" role="alert">{error}</p>}<button className="academy-button-secondary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save note"}</button></form>
  </OperationsDialog>;
}
