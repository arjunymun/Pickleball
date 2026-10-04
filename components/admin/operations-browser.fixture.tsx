import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AcademyOperations } from "./academy-operations";
import { AcademyCustomers } from "./academy-customers";
import { AcademyPayments } from "./academy-payments";
import type { AcademyBooking, AcademyCustomer, AdminSchedulePayload } from "@/lib/academy/contracts";
import { slotStart } from "@/lib/academy/time";
import styles from "./operations.module.css";
import type { AdminReconciliationPayload } from "@/lib/academy/reconciliation-types";

// Component QA only. This entry is never imported by an application route.
const fixedNow = Date.parse("2026-10-03T01:00:00Z");
globalThis.Date = new Proxy(Date, {
  construct(target, args) { return args.length ? Reflect.construct(target, args) : new target(fixedNow); },
  get(target, key) { return key === "now" ? () => fixedNow : Reflect.get(target, key); },
});
const courts = Array.from({ length: 4 }, (_, i) => ({ id: `court-${i + 1}`, name: `Court ${i + 1}`, number: i + 1 }));
function booking(id: string, court: number, hour: number, name: string, status: AcademyBooking["status"], paymentStatus: AcademyBooking["paymentStatus"] = "paid"): AcademyBooking {
  return { id, courtId: courts[court - 1].id, courtName: courts[court - 1].name, customerId: "player-one", customerName: name, startsAt: slotStart("2026-10-03", hour), endsAt: slotStart("2026-10-03", hour + 1), status, paymentStatus, amountPaise: 50000, refundedPaise: 0, holdExpiresAt: status === "held" ? "2026-10-03T01:10:00Z" : null, source: "online", reference: null, reason: null, createdAt: "2026-10-02T12:00:00Z" };
}
let bookings = [booking("confirmed", 1, 6, "Asha Test", "confirmed"), booking("checked-in", 2, 6, "Dev Test", "checked_in"), booking("completed", 3, 6, "Riya Test", "completed"), booking("hold", 1, 7, "Arjun Test", "held", "pending"), { ...booking("platform", 2, 7, "Karan Test", "confirmed", "external"), source: "playo" as const, reference: "QA-PL-104" }, booking("no-show", 3, 7, "Vijay Test", "no_show"), booking("cancelled", 4, 8, "Neha Test", "cancelled")];
let blocks = [{ id: "maintenance", courtId: courts[3].id, startsAt: slotStart("2026-10-03", 6), endsAt: slotStart("2026-10-03", 8), reason: "Morning court surface care" }];
const member = { id: "member-one", customerId: "player-one", status: "active" as const, currentPeriodStart: "2026-10-01T00:00:00Z", paidThrough: "2026-11-01T00:00:00Z", cancelAtPeriodEnd: false, subscriptionId: "qa-subscription" };
const customers: AcademyCustomer[] = [{ id: "player-one", name: "Asha Test", email: "asha@example.test", phone: null, note: "Prefers the morning group. Bring beginner paddles.", membership: member, attendance: [] }, { id: "player-two", name: "Dev Test", email: "dev@example.test", phone: null, note: null, membership: null, attendance: [] }, { id: "player-three", name: "Karan Test", email: "karan@example.test", phone: null, note: "Arrives with a group of four.", membership: { ...member, id: "member-expired", customerId: "player-three", status: "expired", paidThrough: "2026-09-30T00:00:00Z" }, attendance: [] }];
let fail = false;
let writes = 0;
const queue: AdminReconciliationPayload = { paymentMode: "test", generatedAt: "2026-10-03T01:00:00Z", attempts: [{ id: "qa-attempt", kind: "court", bookingId: "qa-booking", customerName: "Asha Test", amountPaise: 50000, providerId: "order_QA123", status: "reconcile", createdAt: "2026-10-03T00:40:00Z", lastCheckedAt: null }], refunds: [{ id: "qa-refund", bookingId: "qa-cancelled", customerName: "Dev Test", paymentId: "pay_QA456", providerRefundId: "rfnd_QA456", amountPaise: 25000, status: "failed", reason: "Player requested a partial refund after cancelling.", createdAt: "2026-10-03T00:00:00Z", lastCheckedAt: "2026-10-03T00:55:00Z" }], cancellations: [{ id: "qa-cancellation", customerName: "Karan Test", subscriptionId: "sub_QA789", createdAt: "2026-10-02T12:00:00Z", lastCheckedAt: null }], webhooks: { failed: 1, processing: 0 }, instructions: ["Verify failed refunds using the existing payment and refund references."] };
const response = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
globalThis.fetch = async (input, init) => {
  if (fail) throw new Error("Simulated component-test network outage");
  const url = new URL(String(input), location.href);
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  if (url.pathname === "/api/admin/reconciliation") return init?.method === "POST" ? response({ processed: 1, failed: 1, unresolved: 2 }) : response(queue);
  if (url.pathname === "/api/admin/schedule") {
    const date = url.searchParams.get("date") ?? "2026-10-03";
    return response({ date, courts, bookings: date === "2026-10-03" ? bookings : [], blocks: date === "2026-10-03" ? blocks : [], metrics: { bookingCount: bookings.length, occupiedHours: 6, collectedPaise: 250000, refundedPaise: 0 }, paymentMode: "test" } satisfies AdminSchedulePayload);
  }
  if (url.pathname === "/api/admin/customers") return response({ customers });
  if (url.pathname === "/api/admin/bookings" && init?.method === "POST") {
    writes += 1;
    const selectedCourt = courts.find((court) => court.id === body.courtId)!;
    const created = { ...booking(`created-${writes}`, selectedCourt.number, 9, body.customerName, "confirmed", body.paymentStatus), customerId: body.customerId ?? null, source: body.source, reference: body.reference ?? null, reason: body.reason ?? null, amountPaise: body.amountPaise, startsAt: body.startsAt, endsAt: new Date(Date.parse(body.startsAt) + 3600000).toISOString() };
    if (bookings.some((entry) => entry.courtId === created.courtId && entry.startsAt === created.startsAt && !["cancelled", "expired"].includes(entry.status))) return response({ error: "That court time is no longer available.", code: "CONFLICT" }, 409);
    bookings = [...bookings, created]; return response({ booking: created });
  }
  const actionMatch = url.pathname.match(/^\/api\/admin\/bookings\/([^/]+)\/action$/);
  if (actionMatch) {
    writes += 1;
    const existing = bookings.find((entry) => entry.id === actionMatch[1])!;
    existing.status = body.action === "check_in" ? "checked_in" : body.action === "complete" ? "completed" : body.action === "no_show" ? "no_show" : "cancelled";
    if (body.refundPaise) existing.paymentStatus = "refund_pending";
    return response({ booking: existing });
  }
  if (url.pathname === "/api/admin/blocks") {
    writes += 1; const block = { id: `block-${writes}`, ...body }; blocks = [...blocks, block]; return response({ block });
  }
  if (url.pathname.startsWith("/api/admin/blocks/") && init?.method === "DELETE") { writes += 1; blocks = blocks.filter((block) => block.id !== url.pathname.split("/").at(-1)); return response({ ok: true }); }
  const noteMatch = url.pathname.match(/^\/api\/admin\/customers\/([^/]+)\/notes$/);
  if (noteMatch) { writes += 1; customers.find((customer) => customer.id === noteMatch[1])!.note = body.body; return response({ ok: true }); }
  if (url.pathname === "/api/admin/attendance") {
    const customer = customers.find((entry) => entry.id === body.customerId)!;
    if (customer.attendance.length) return response({ error: "This member's included hour has already been recorded today.", code: "BENEFIT_USED" }, 409);
    writes += 1; const attendance = { id: `attendance-${writes}`, customerId: body.customerId, date: body.date, checkedInAt: new Date().toISOString() }; customer.attendance.push(attendance); return response({ attendance });
  }
  return response({ error: "No fixture response is defined for this request." }, 404);
};

function StaffFixture() {
  const [screen, setScreen] = useState("schedule");
  const [offline, setOffline] = useState(false);
  return <div className={styles.shell}><p style={{ background: "#fff3cc", margin: 0, padding: 12, fontSize: 14 }}>Component test fixture · synthetic players and simulated requests · no production access or writes.</p><header className={styles.staffHeader}><strong>Doon Pickleball Academy · Front desk</strong><span>Staff QA</span></header><nav className={styles.navigation} aria-label="Fixture screens"><button onClick={() => setScreen("schedule")}>Court schedule</button><button onClick={() => setScreen("customers")}>Players & attendance</button><button onClick={() => setScreen("payments")}>Payment follow-ups</button><button onClick={() => { fail = !offline; setOffline(!offline); }}>{offline ? "Restore fixture requests" : "Simulate request outage"}</button></nav><main id="main-content" className={styles.main}>{screen === "schedule" ? <AcademyOperations /> : screen === "payments" ? <AcademyPayments /> : <AcademyCustomers />}</main></div>;
}
createRoot(document.getElementById("root")!).render(<StaffFixture />);
