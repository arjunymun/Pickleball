"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { academyFetch, academyPost } from "@/lib/academy/client";
import { formatMoney } from "@/lib/academy/config";
import type { AcademyBlock, AcademyBooking, AdminSchedulePayload } from "@/lib/academy/contracts";
import { addDays, formatCourtDate, formatCourtTime, indiaDate, isValidDate } from "@/lib/academy/time";
import { BookingEntry, BlockEntry } from "./operations-entry";
import { OperationsDialog } from "./operations-dialog";
import { displayStatus, parseRupees, requestKey, sourceLabels } from "./operations-utils";
import styles from "./operations.module.css";
import { CourtTimeline } from "./court-timeline";

type Selection = { kind: "booking"; booking: AcademyBooking } | { kind: "block"; block: AcademyBlock } | { kind: "entry"; courtId: string; hour: number } | { kind: "maintenance"; courtId: string; hour: number };

export function AcademyOperations() {
  const [date, setDate] = useState(() => indiaDate());
  const [payload, setPayload] = useState<AdminSchedulePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [courtFilter, setCourtFilter] = useState("all");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [entryBusy, setEntryBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date().getTime());
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await academyFetch<AdminSchedulePayload>(`/api/admin/schedule?date=${encodeURIComponent(date)}`);
      if (version === requestVersion.current) { setPayload(result); setUpdatedAt(new Date().toISOString()); setClock(new Date().getTime()); }
    } catch (failure) {
      if (version === requestVersion.current) setError(failure instanceof Error ? failure.message : "Unable to load the court schedule.");
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [date]);
  useEffect(() => {
    void refresh();
    return () => { requestVersion.current += 1; };
  }, [refresh]);
  const visible = payload?.date === date ? payload : null;
  const courts = visible?.courts.filter((court) => courtFilter === "all" || court.id === courtFilter) ?? [];
  const changeDate = (next: string) => { if (isValidDate(next)) { setDate(next); setSelection(null); setNotice(""); } };
  async function saved(message: string) { setSelection(null); setNotice(message); await refresh(); }

  return <>
    <div className={styles.pageHeading}><div><p className="academy-eyebrow">Front desk · Asia/Kolkata</p><h1>The court board.</h1><p>Four courts. One hour at a time. Every reservation in one place.</p></div><div className={styles.actions}><button className="academy-button-secondary" type="button" onClick={() => void refresh()} disabled={loading}>Refresh</button><button className="academy-button" type="button" disabled={!visible || loading || Boolean(error)} onClick={() => setSelection({ kind: "entry", courtId: visible!.courts[0]?.id ?? "", hour: 6 })}>Add reservation</button></div></div>
    {notice && <p className={styles.success} role="status">{notice}</p>}
    {error && <div className="academy-alert" role="alert"><strong>Schedule unavailable.</strong> {error} <button type="button" onClick={() => void refresh()} disabled={loading}>Retry</button><p>Shown reservations may be out of date. Actions stay locked until refreshed.</p></div>}
    <section className={styles.metrics} aria-label="Selected day totals">{[
      ["Reservations", visible?.metrics.bookingCount], ["Occupied hours", visible?.metrics.occupiedHours], ["Recorded receipts", visible ? formatMoney(visible.metrics.collectedPaise) : undefined], ["Refunded", visible ? formatMoney(visible.metrics.refundedPaise) : undefined],
    ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value ?? "—"}</strong></div>)}</section>
    <section className={styles.schedulePanel} aria-label="Court schedule">
      <div className={styles.boardToolbar}><div className={styles.dateControls}><button type="button" aria-label="Previous day" onClick={() => changeDate(addDays(date, -1))}>←</button><label>Schedule date<input className="academy-input" type="date" value={date} onChange={(event) => changeDate(event.target.value)} /></label><button type="button" aria-label="Next day" onClick={() => changeDate(addDays(date, 1))}>→</button><button type="button" onClick={() => changeDate(indiaDate())}>Today</button></div><label className={styles.courtSelector}>Courts<select className="academy-input" value={courtFilter} onChange={(event) => setCourtFilter(event.target.value)}><option value="all">All four courts</option>{visible?.courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></label></div>
      <div className={styles.boardInfo}><h2>{formatCourtDate(date, { weekday: "long", year: "numeric" })}</h2><span role="status">{loading ? "Updating schedule…" : updatedAt ? `Updated ${formatCourtTime(updatedAt)} IST · refresh for latest` : "Waiting for the service"}</span></div>
      <div className={styles.legend}><span><i className={styles.legendConfirmed} />Confirmed / checked in</span><span><i className={styles.legendHeld} />Checkout hold</span><span><i className={styles.legendBlocked} />Maintenance</span><span>Completed and no-show records stay on the board.</span></div>
      {visible && courts.length > 0 ? <CourtTimeline now={clock} payload={visible} date={date} courts={courts} locked={loading || Boolean(error)} onBooking={(booking) => setSelection({ kind: "booking", booking })} onBlock={(block) => setSelection({ kind: "block", block })} onOpen={(courtId, hour) => setSelection({ kind: "entry", courtId, hour })} /> : !loading && !error ? <div className={styles.empty}><h3>No courts are configured.</h3><p>The owner must complete academy setup before reservations can be managed.</p></div> : !visible && <p className={styles.empty} role="status">{loading ? "Loading the selected day's court board…" : "Connect to the academy service to load the schedule."}</p>}
      <div className={styles.boardFooter}><p>06:00–24:00 IST · one-hour court reservations</p><button className="academy-button-secondary" type="button" disabled={!visible || loading || Boolean(error)} onClick={() => setSelection({ kind: "maintenance", courtId: visible!.courts[0]?.id ?? "", hour: 6 })}>Add maintenance block</button></div>
    </section>
    <p className={styles.footnote}>Playo, Hudle and District entries are recorded manually. The board does not synchronize with external platforms.</p>
    {selection?.kind === "booking" && <BookingDetails key={selection.booking.id} booking={selection.booking} onClose={() => setSelection(null)} onSaved={saved} />}
    {selection?.kind === "block" && <BlockDetails block={selection.block} onClose={() => setSelection(null)} onSaved={saved} />}
    {selection?.kind === "entry" && visible && <OperationsDialog title="Add a reservation" dismissDisabled={entryBusy} onClose={() => setSelection(null)}><BookingEntry date={date} courts={visible.courts} courtId={selection.courtId} hour={selection.hour} onSaved={saved} onBusyChange={setEntryBusy} /></OperationsDialog>}
    {selection?.kind === "maintenance" && visible && <OperationsDialog title="Block court time" dismissDisabled={entryBusy} onClose={() => setSelection(null)}><BlockEntry date={date} courts={visible.courts} courtId={selection.courtId} hour={selection.hour} onSaved={saved} onBusyChange={setEntryBusy} /></OperationsDialog>}
  </>;
}

function BookingDetails({ booking, onClose, onSaved }: { booking: AcademyBooking; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState("none");
  const [amount, setAmount] = useState("");
  const retry = useRef<{ signature: string; key: string } | null>(null);
  const remaining = Math.max(0, booking.amountPaise - booking.refundedPaise);
  const refundable = !["pending", "failed", "not_required", "refund_pending"].includes(booking.paymentStatus) && remaining > 0;
  async function action(actionName: "check_in" | "complete" | "no_show" | "cancel") {
    setError("");
    setBusy(true);
    try {
      let refundPaise = 0;
      if (actionName === "cancel") {
        if (reason.trim().length < 3) throw new Error("Enter a cancellation reason using at least three characters.");
        refundPaise = refund === "full" ? remaining : refund === "partial" ? parseRupees(amount) : 0;
        if (refund === "partial" && (refundPaise <= 0 || refundPaise >= remaining)) throw new Error("A partial refund must be greater than zero and less than the remaining paid amount.");
      }
      const body = { action: actionName, ...(actionName === "cancel" ? { reason: reason.trim(), refundPaise } : {}) };
      const result = await academyPost<{ booking: AcademyBooking }>(`/api/admin/bookings/${booking.id}/action`, { ...body, idempotencyKey: requestKey(retry, body) });
      await onSaved(actionName === "cancel" ? result.booking.paymentStatus === "refund_pending" ? "Reservation cancelled. Gateway refund is pending verification." : "Reservation cancelled; the refund decision has been recorded." : `${booking.customerName}: ${displayStatus(result.booking.status)}.`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to update the reservation."); }
    finally { setBusy(false); }
  }
  return <OperationsDialog title="Reservation details" onClose={onClose} dismissDisabled={busy}><p className={styles.detailName}>{booking.customerName}</p><p className={styles.detailSubtitle}>{booking.courtName} · {formatCourtDate(booking.startsAt)} · {formatCourtTime(booking.startsAt)}–{formatCourtTime(booking.endsAt)}</p><dl className={styles.details}><div><dt>Status</dt><dd>{displayStatus(booking.status)}</dd></div><div><dt>Payment</dt><dd>{displayStatus(booking.paymentStatus)}</dd></div><div><dt>Total</dt><dd>{formatMoney(booking.amountPaise)}</dd></div><div><dt>Refunded</dt><dd>{formatMoney(booking.refundedPaise)}</dd></div><div><dt>Source</dt><dd>{sourceLabels[booking.source]}</dd></div><div><dt>Reference</dt><dd>{booking.reference ?? "—"}</dd></div><div><dt>Booking ID</dt><dd className={styles.identifier}>{booking.id}</dd></div>{booking.holdExpiresAt && booking.status === "held" && <div><dt>Hold expires</dt><dd>{formatCourtTime(booking.holdExpiresAt)} IST</dd></div>}{booking.reason && <div><dt>Staff reason</dt><dd>{booking.reason}</dd></div>}</dl>
    {error && <p className="academy-alert" role="alert">{error}</p>}
    <div className={styles.actions}>{booking.status === "confirmed" && <><button className="academy-button" type="button" disabled={busy} onClick={() => void action("check_in")}>Check in</button><button className="academy-button-secondary" type="button" disabled={busy} onClick={() => void action("no_show")}>Mark no-show</button></>}{booking.status === "checked_in" && <button className="academy-button" type="button" disabled={busy} onClick={() => void action("complete")}>Complete session</button>}{["held", "confirmed", "checked_in"].includes(booking.status) && <button className={styles.dangerButton} type="button" disabled={busy} onClick={() => setCancelling(!cancelling)}>Cancel reservation</button>}</div>
    {cancelling && <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void action("cancel"); }}><h3>Record a cancellation</h3><label>Reason<textarea className="academy-input" required value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} /></label><label>Refund decision<select className="academy-input" value={refund} onChange={(event) => setRefund(event.target.value)}><option value="none">No refund</option>{refundable && <><option value="full">Full remaining amount — {formatMoney(remaining)}</option><option value="partial">Partial refund</option></>}</select></label>{refund === "partial" && <label>Refund amount (₹)<input className="academy-input" inputMode="decimal" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>}<p className={styles.helper}>{booking.paymentStatus === "cash" || booking.paymentStatus === "external" ? "Record money returned through the original cash or external payment channel. This action does not transfer money through a gateway." : "Gateway refunds are requested by the server and remain pending until verified."}</p><button className="academy-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Confirm cancellation"}</button></form>}
    {booking.status === "held" && <p className={styles.helper}>An online checkout hold confirms only after the gateway verifies captured payment. Staff cannot mark a checkout paid.</p>}
  </OperationsDialog>;
}

function BlockDetails({ block, onClose, onSaved }: { block: AcademyBlock; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true); setError("");
    try { await academyFetch<{ ok: true }>(`/api/admin/blocks/${block.id}`, { method: "DELETE" }); await onSaved("Maintenance block removed. Court availability has been refreshed."); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to remove this block."); }
    finally { setBusy(false); }
  }
  return <OperationsDialog title="Maintenance block" onClose={onClose} dismissDisabled={busy}><p className={styles.detailName}>{block.reason}</p><p>{formatCourtDate(block.startsAt)} · {formatCourtTime(block.startsAt)}–{formatCourtTime(block.endsAt)} IST</p><p className={styles.helper}>Removing this block makes the court available again if no reservation overlaps.</p>{error && <p className="academy-alert" role="alert">{error}</p>}<button className={styles.dangerButton} type="button" disabled={busy} onClick={() => void remove()}>{busy ? "Removing…" : "Remove maintenance block"}</button></OperationsDialog>;
}
