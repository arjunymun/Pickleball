"use client";

import { useEffect, useRef, useState } from "react";
import { academyFetch, academyPost } from "@/lib/academy/client";
import { ACADEMY, formatMoney } from "@/lib/academy/config";
import type { AcademyBlock, AcademyBooking, AcademyCourt, AcademyCustomer, AdminCustomersPayload, StaffBookingSource } from "@/lib/academy/contracts";
import { indiaDate, slotStart } from "@/lib/academy/time";
import { hourEnd, paidMember, parseRupees, requestKey, sourceLabels } from "./operations-utils";
import styles from "./operations.module.css";

const hours = Array.from({ length: 18 }, (_, index) => index + 6);
const externalSources = ["playo", "hudle", "district"];
type EntryProps = { date: string; courts: AcademyCourt[]; courtId: string; hour: number; onSaved: (message: string) => Promise<void>; onBusyChange: (busy: boolean) => void };

export function BookingEntry({ date, courts, courtId: initialCourt, hour: initialHour, onSaved, onBusyChange }: EntryProps) {
  const [courtId, setCourtId] = useState(initialCourt);
  const [hour, setHour] = useState(initialHour);
  const [source, setSource] = useState<StaffBookingSource>("walk_in");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("500");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [reason, setReason] = useState("");
  const [customers, setCustomers] = useState<AcademyCustomer[]>([]);
  const [lookupError, setLookupError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef<{ signature: string; key: string } | null>(null);
  useEffect(() => {
    let active = true;
    academyFetch<AdminCustomersPayload>("/api/admin/customers").then((result) => { if (active) setCustomers(result.customers); }).catch((failure: unknown) => { if (active) setLookupError(failure instanceof Error ? failure.message : "Player lookup unavailable."); });
    return () => { active = false; };
  }, []);
  const member = customers.find((customer) => customer.id === customerId);
  const activeMember = paidMember(member?.membership ?? null, slotStart(date, hour));
  const benefitUsed = Boolean(member?.attendance.some((entry) => entry.date === date));
  const standardPrice = source === "individual_play" ? activeMember ? 0 : ACADEMY.individualPricePaise : activeMember ? ACADEMY.memberCourtPricePaise : ACADEMY.courtPricePaise;
  function chooseCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((entry) => entry.id === id);
    if (customer) setCustomerName(customer.name);
    const isMember = paidMember(customer?.membership ?? null, slotStart(date, hour));
    const price = source === "individual_play" ? isMember ? 0 : 125 : isMember ? 400 : 500;
    setAmount(String(price));
    setPaymentStatus(price === 0 ? "not_required" : "pending");
  }
  function chooseSource(next: StaffBookingSource) {
    setSource(next); setPaymentStatus("pending");
    setAmount(String(next === "individual_play" ? activeMember ? 0 : 125 : activeMember ? 400 : 500));
    if (next === "individual_play" && activeMember) setPaymentStatus("not_required");
  }
  async function save() {
    setBusy(true); onBusyChange(true); setError("");
    try {
      const amountPaise = parseRupees(amount);
      if (customerName.trim().length < 2) throw new Error("Enter the player's name using at least two characters.");
      if (externalSources.includes(source) && !reference.trim()) throw new Error("Enter the external platform reservation reference.");
      if (["cash", "external", "not_required"].includes(paymentStatus) && !reference.trim() && !reason.trim()) throw new Error("A payment decision requires a reference or staff reason.");
      if (amountPaise !== standardPrice && !reason.trim()) throw new Error("A price override requires a reason.");
      if (reason.trim() && reason.trim().length < 3) throw new Error("Use at least three characters for the staff reason.");
      if (paymentStatus === "not_required" && amountPaise !== 0) throw new Error("No payment required is only valid for a zero-price reservation.");
      if (source === "individual_play" && amountPaise === 0 && date !== indiaDate()) throw new Error("The included member hour can only be recorded for today when the player arrives.");
      if (source === "individual_play" && amountPaise === 0 && benefitUsed) throw new Error("This player's included hour has already been recorded today. Charge for an additional hour and explain the price override.");
      const body = { courtId, startsAt: slotStart(date, hour), source, customerName: customerName.trim(), customerId: customerId || undefined, reference: reference.trim() || undefined, amountPaise, paymentStatus, reason: reason.trim() || undefined };
      const result = await academyPost<{ booking: AcademyBooking }>("/api/admin/bookings", { ...body, idempotencyKey: requestKey(retry, body) });
      await onSaved(`${result.booking.customerName}'s ${sourceLabels[result.booking.source].toLowerCase()} reservation added. Payment: ${result.booking.paymentStatus.replaceAll("_", " ")}.`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to add this reservation."); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void save(); }}><p className={styles.helper}>Reserve one full court-hour. A zero-price individual reservation for a paid member also records today&apos;s included hour. For group sessions, record other members&apos; attendance on their player profiles.</p><div className={styles.formRow}><label>Court<select className="academy-input" value={courtId} onChange={(event) => setCourtId(event.target.value)}>{courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></label><label>Start time · {date} IST<select className="academy-input" value={hour} onChange={(event) => setHour(Number(event.target.value))}>{hours.map((value) => <option key={value} value={value}>{String(value).padStart(2, "0")}:00–{String(value + 1).padStart(2, "0")}:00</option>)}</select></label></div>
    <label>Reservation source<select className="academy-input" value={source} onChange={(event) => chooseSource(event.target.value as StaffBookingSource)}>{Object.entries(sourceLabels).filter(([value]) => value !== "online").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Link registered player<select className="academy-input" value={customerId} onChange={(event) => chooseCustomer(event.target.value)}><option value="">Guest / unregistered player</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>)}</select></label>{lookupError && <p className={styles.helper} role="status">Registered player lookup unavailable: {lookupError} Retry after refreshing to apply member pricing.</p>}
    <label>Player / group name<input className="academy-input" required maxLength={120} autoComplete="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
    <label>{externalSources.includes(source) ? "Platform reference (required)" : "Reference (optional)"}<input className="academy-input" required={externalSources.includes(source)} maxLength={120} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
    <div className={styles.formRow}><label>Reservation amount (₹)<input className="academy-input" required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Payment recorded<select className="academy-input" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)}><option value="pending">Not collected yet</option><option value="cash">Cash collected at venue</option>{externalSources.includes(source) && <option value="external">Collected by external platform</option>}<option value="not_required">No payment required (₹0)</option></select></label></div>
    <p className={styles.helper}>Standard amount: {formatMoney(standardPrice)}. {source === "individual_play" ? "This is one person's individual hour. Add a reason for a group price. Saving an included ₹0 member hour records attendance atomically; do not record the same hour twice." : activeMember ? "Paid-member court rate applies." : "A paid member's court reservation costs ₹400; membership does not include free court bookings."} Cash and platform receipts are staff records, not gateway captures.</p>
    {source === "individual_play" && benefitUsed && <p className={styles.helper}>This member&apos;s included hour is already recorded for this date. An additional individual hour needs payment and a price override reason.</p>}
    <label>Staff reason / price override note<textarea className="academy-input" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>{error && <p className="academy-alert" role="alert">{error}</p>}<button className="academy-button" type="submit" disabled={busy || !courtId}>{busy ? "Saving reservation…" : "Save reservation"}</button>
  </form>;
}

export function BlockEntry({ date, courts, courtId: initialCourt, hour: initialHour, onSaved, onBusyChange }: EntryProps) {
  const [courtId, setCourtId] = useState(initialCourt);
  const [startHour, setStartHour] = useState(initialHour);
  const [endHour, setEndHour] = useState(initialHour + 1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const retry = useRef<{ signature: string; key: string } | null>(null);
  async function save() {
    setBusy(true); onBusyChange(true); setError("");
    try {
      if (endHour <= startHour) throw new Error("The block must end after it starts.");
      if (reason.trim().length < 3) throw new Error("Enter a maintenance reason using at least three characters.");
      const body = { courtId, startsAt: slotStart(date, startHour), endsAt: hourEnd(date, endHour), reason: reason.trim() };
      await academyPost<{ block: AcademyBlock }>("/api/admin/blocks", { ...body, idempotencyKey: requestKey(retry, body) });
      await onSaved("Maintenance block added. Customers cannot book this court time.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to add maintenance block."); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void save(); }}><p className={styles.helper}>Use a block for repairs, closures or court care. Existing holds and reservations must be resolved before blocking their time.</p><label>Court<select className="academy-input" value={courtId} onChange={(event) => setCourtId(event.target.value)}>{courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}</select></label><div className={styles.formRow}><label>From · {date} IST<select className="academy-input" value={startHour} onChange={(event) => { const next = Number(event.target.value); setStartHour(next); if (endHour <= next) setEndHour(next + 1); }}>{hours.map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, "0")}:00</option>)}</select></label><label>Until · IST<select className="academy-input" value={endHour} onChange={(event) => setEndHour(Number(event.target.value))}>{hours.map((hour) => hour + 1).filter((hour) => hour > startHour).map((hour) => <option key={hour} value={hour}>{hour === 24 ? "24:00 (midnight)" : `${String(hour).padStart(2, "0")}:00`}</option>)}</select></label></div><label>Reason<textarea className="academy-input" required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>{error && <p className="academy-alert" role="alert">{error}</p>}<button className="academy-button" type="submit" disabled={busy || !courtId}>{busy ? "Blocking court…" : "Save maintenance block"}</button></form>;
}
