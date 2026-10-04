import { createRoot } from "react-dom/client";
import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { BookingReview } from "@/components/customer/booking-review";
import { CustomerAccount } from "@/components/customer/customer-account";
import { AcademyMembershipPage } from "@/components/customer/academy-membership";
import { CourtBooking } from "@/components/customer/court-booking";
import type { AcademyBooking, AcademyCourt, AcademyMembership, AvailabilityPayload, CustomerAccountPayload, MembershipCheckoutPayload } from "@/lib/academy/contracts";
import { slotStart } from "@/lib/academy/time";
import "@/app/globals.css";

// Test fixture entry only: no application route imports this file.
type Fixture = "success" | "held" | "expired" | "verification-pending" | "renewal-cancel" | "active" | "membership-expired" | "error";
const choices: Array<{ label: string; url: string }> = [
  { label: "Choose a court", url: "/book?fixture=held" },
  { label: "Held booking", url: "/book/review?booking=fixture-booking-1&fixture=held" },
  { label: "Checkout success", url: "/book/review?booking=fixture-booking-1&fixture=success" },
  { label: "Expired hold", url: "/book/review?booking=fixture-booking-1&fixture=expired" },
  { label: "Verification pending", url: "/book/review?booking=fixture-booking-1&fixture=verification-pending" },
  { label: "API error", url: "/book/review?booking=fixture-booking-1&fixture=error" },
  { label: "Account", url: "/app?fixture=success" },
  { label: "Membership", url: "/membership?fixture=active" },
  { label: "Renewal cancelled", url: "/membership?fixture=renewal-cancel" },
  { label: "Expired membership", url: "/membership?fixture=membership-expired" },
];
const selectedFixture = (): Fixture => {
  const value = new URLSearchParams(location.search).get("fixture");
  return choices.some(({ url }) => new URL(url, location.origin).searchParams.get("fixture") === value) ? value as Fixture : "success";
};
const initialFixture = selectedFixture();
const now = Date.now();
const start = new Date(now + 2 * 86_400_000);
start.setHours(17, 0, 0, 0);
const end = new Date(start.getTime() + 3_600_000);
const member: AcademyMembership = {
  id: "fixture-membership-1", customerId: "fixture-customer-1", status: "active",
  currentPeriodStart: new Date(now - 10 * 86_400_000).toISOString(),
  paidThrough: new Date(now + 20 * 86_400_000).toISOString(),
  cancelAtPeriodEnd: initialFixture === "renewal-cancel", subscriptionId: "fixture-subscription-1",
};

function booking(fixture: Fixture): AcademyBooking {
  const expired = fixture === "expired";
  const confirmed = fixture === "success";
  return {
    id: "fixture-booking-1", courtId: "fixture-court-1", courtName: "Court 1",
    customerId: "fixture-customer-1", customerName: "Aarav Sharma",
    startsAt: start.toISOString(), endsAt: end.toISOString(),
    status: expired ? "expired" : confirmed ? "confirmed" : "held",
    paymentStatus: expired ? "failed" : confirmed ? "paid" : "pending",
    amountPaise: initialFixture === "active" || initialFixture === "renewal-cancel" ? 40_000 : 50_000,
    refundedPaise: 0,
    holdExpiresAt: expired ? new Date(now - 60_000).toISOString() : new Date(now + 9 * 60_000).toISOString(),
    source: "online", reference: null, reason: null, createdAt: new Date(now - 60_000).toISOString(),
  };
}

function account(): CustomerAccountPayload {
  let membership: AcademyMembership | null = null;
  if (initialFixture === "active" || initialFixture === "renewal-cancel") membership = member;
  if (initialFixture === "membership-expired") membership = { ...member, status: "expired", paidThrough: new Date(now - 60_000).toISOString() };
  return {
    user: { id: "fixture-customer-1", email: "aarav@example.test", name: "Aarav Sharma", role: "customer" },
    bookings: [booking(initialFixture)], membership, attendance: [], paymentMode: "test",
  };
}

let renewalCancelled = initialFixture === "renewal-cancel";
const makeResponse = (payload: unknown, status = 200) => Response.json(payload, { status, headers: { "X-Customer-Fixture": "synthetic-test-only" } });
globalThis.fetch = async (input, init) => {
  if (initialFixture === "error") throw new Error("Synthetic customer fixture service outage.");
  const url = new URL(input instanceof Request ? input.url : String(input), location.href);
  if (url.pathname === "/api/availability") {
    const date = url.searchParams.get("date") ?? new Date(now + 86_400_000).toISOString().slice(0, 10);
    const courts: AcademyCourt[] = Array.from({ length: 4 }, (_, index) => ({ id: `fixture-court-${index + 1}`, name: `Court ${index + 1}`, number: index + 1 }));
    const slots: AvailabilityPayload["slots"] = courts.flatMap((court) => Array.from({ length: 18 }, (_, index) => {
      const hour = index + 6;
      const startsAt = slotStart(date, hour);
      return { id: `${court.id}-${date}-${hour}`, courtId: court.id, startsAt, endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(), available: true, pricePaise: initialFixture === "active" || initialFixture === "renewal-cancel" ? 40_000 : 50_000 };
    }));
    return makeResponse({ date, timezone: "Asia/Kolkata", courts, slots, generatedAt: new Date(now).toISOString() } satisfies AvailabilityPayload);
  }
  if (url.pathname === "/api/bookings/holds" && init?.method === "POST") return makeResponse({ booking: booking("held") });
  if (url.pathname === "/api/bookings/me") return makeResponse({ ...account(), membership: renewalCancelled ? { ...member, cancelAtPeriodEnd: true } : account().membership } satisfies CustomerAccountPayload);
  if (url.pathname === "/api/session") return makeResponse({ user: account().user, membership: renewalCancelled ? { ...member, cancelAtPeriodEnd: true } : account().membership, configured: true, paymentMode: "test" });
  if (url.pathname.endsWith("/checkout") && url.pathname.startsWith("/api/bookings/")) return makeResponse({ keyId: "fixture_key_test_only", orderId: "fixture_order_test_only", amountPaise: 50_000, currency: "INR", bookingId: "fixture-booking-1", testMode: true });
  if (url.pathname === "/api/payments/verify" && init?.method === "POST") {
    if (initialFixture === "verification-pending") return makeResponse({ booking: booking(initialFixture) });
    return makeResponse({ booking: { ...booking("success"), status: "confirmed", paymentStatus: "paid" } });
  }
  if (url.pathname === "/api/memberships/checkout") return makeResponse({ keyId: "fixture_key_test_only", subscriptionId: "fixture_subscription_test_only", amountPaise: 250_000, currency: "INR", testMode: true } satisfies MembershipCheckoutPayload);
  if (url.pathname === "/api/memberships/cancel" && init?.method === "POST") {
    renewalCancelled = true;
    return makeResponse({ membership: { ...member, cancelAtPeriodEnd: true } });
  }
  return makeResponse({ error: "No synthetic response is defined for this request." }, 404);
};

type GatewayOptions = ConstructorParameters<NonNullable<Window["Razorpay"]>>[0];
type GatewayInstance = InstanceType<NonNullable<Window["Razorpay"]>>;
class FixtureGateway implements GatewayInstance {
  constructor(private readonly options: GatewayOptions) {}
  open() { window.setTimeout(() => this.options.handler({ razorpay_order_id: "fixture_order_test_only", razorpay_payment_id: "fixture_payment_test_only", razorpay_signature: "synthetic_only" }), 350); }
  on() { /* No real gateway events exist in this local fixture. */ }
}
Object.defineProperty(window, "Razorpay", { configurable: true, value: FixtureGateway });

function CustomerFixture() {
  const path = location.pathname;
  const current = new URL(location.href);
  const id = current.searchParams.get("booking");
  return <>
    <p role="note" style={{ margin: 0, padding: "10px 16px", textAlign: "center", background: "#fff3cc", fontSize: 14 }}>TEST-ONLY CUSTOMER FIXTURE · synthetic data and payment responses · no account or payment is real</p>
    <SiteHeader />
    <nav aria-label="Test-only customer fixture states" style={{ borderBottom: "1px solid var(--academy-line)", padding: "12px 0", background: "#f3f6fa" }}>
        <div className="academy-container" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <strong>Fixture states</strong>{choices.map(({ label, url }) => <a key={label} href={url}>{label}</a>)}
      </div>
    </nav>
    <main id="main-content" className="academy-container">
      {path === "/membership" ? <AcademyMembershipPage key={current.search} />
        : path === "/book" ? <CourtBooking key={current.search} />
        : path === "/demo" ? <section className="academy-card" style={{ marginBlock: 32 }}><h1 className="academy-heading">Project walkthrough</h1><p>This isolated walkthrough uses synthetic customer fixtures only. It cannot read production bookings or verify a real payment.</p><a className="academy-button" href="/book?fixture=held">Preview customer booking</a></section>
        : path.includes("confirmation") || path.startsWith("/app") ? <CustomerAccount bookingsOnly={path.includes("bookings")} key={current.search} />
        : <BookingReview key={`${path}${current.search}`} bookingId={id ?? "fixture-booking-1"} />}
    </main>
    <SiteFooter />
  </>;
}

createRoot(document.getElementById("root")!).render(<CustomerFixture />);
