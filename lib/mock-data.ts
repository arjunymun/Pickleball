import {
  type AdminRole,
  type AttendanceEvent,
  type Booking,
  type BookingPayment,
  type BookableSlot,
  type Court,
  type CustomerMembership,
  type CustomerNote,
  type CustomerPack,
  type CustomerProfile,
  type MembershipPlan,
  type Offer,
  type OfferRedemption,
  type PackProduct,
  type SlotTemplate,
  type User,
  type Venue,
  type WalletLedgerEntry,
} from "@/lib/domain";

const venueNow = new Date("2026-04-01T18:00:00+05:30");
export const PREVIEW_CUSTOMER_ID = "customer-rhea";

export const venue: Venue = {
  id: "venue-sideout",
  name: "Sideout Club",
  tagline: "Repeat-play software shaped from a real family-built venue.",
  location: "Dehradun, Uttarakhand",
  timezone: "Asia/Kolkata",
  story:
    "Five courts, warm foothill mornings, and a business that runs better when booking, retention, and member value live in one system.",
};

export const courts: Court[] = [
  { id: "court-1", name: "Court 01", surface: "Outdoor acrylic", lighting: true, outlook: "East light" },
  { id: "court-2", name: "Court 02", surface: "Outdoor acrylic", lighting: true, outlook: "Main deck" },
  { id: "court-3", name: "Court 03", surface: "Outdoor acrylic", lighting: true, outlook: "Tree line" },
  { id: "court-4", name: "Court 04", surface: "Outdoor acrylic", lighting: true, outlook: "Quiet side" },
  { id: "court-5", name: "Court 05", surface: "Outdoor acrylic", lighting: false, outlook: "Practice edge" },
];

export const users: User[] = [
  { id: "user-rhea", name: "Rhea Singh", email: "rhea@example.com", phone: "+91 98765 43110" },
  { id: "user-arav", name: "Arav Sharma", email: "arav@example.com", phone: "+91 98765 43111" },
  { id: "user-meera", name: "Meera Rawat", email: "meera@example.com", phone: "+91 98765 43112" },
  { id: "user-kabir", name: "Kabir Bansal", email: "kabir@example.com", phone: "+91 98765 43113" },
  { id: "user-tara", name: "Tara Mehta", email: "tara@example.com", phone: "+91 98765 43114" },
  { id: "user-owner", name: "Aarav Yadav", email: "owner@sideout.club", phone: "+91 98765 43115" },
  { id: "user-staff", name: "Naina Joshi", email: "ops@sideout.club", phone: "+91 98765 43116" },
];

export const customerProfiles: CustomerProfile[] = [
  {
    id: "customer-rhea",
    userId: "user-rhea",
    joinedAt: "2026-01-09T08:00:00+05:30",
    favoriteWindow: "Sunrise",
    skillBand: "3.5 to 4.0",
    tags: ["member", "weekday regular", "offer-responsive"],
  },
  {
    id: "customer-arav",
    userId: "user-arav",
    joinedAt: "2025-12-12T08:00:00+05:30",
    favoriteWindow: "After work",
    skillBand: "4.0",
    tags: ["prime-time", "high LTV"],
  },
  {
    id: "customer-meera",
    userId: "user-meera",
    joinedAt: "2026-02-02T08:00:00+05:30",
    favoriteWindow: "Sunset",
    skillBand: "3.0",
    tags: ["pack holder", "at-risk"],
  },
  {
    id: "customer-kabir",
    userId: "user-kabir",
    joinedAt: "2025-11-18T08:00:00+05:30",
    favoriteWindow: "Weekend mornings",
    skillBand: "4.0+",
    tags: ["member", "brings guests"],
  },
  {
    id: "customer-tara",
    userId: "user-tara",
    joinedAt: "2026-03-01T08:00:00+05:30",
    favoriteWindow: "Flexible",
    skillBand: "Beginner",
    tags: ["new player", "promo-converted"],
  },
];

export const adminRoles: AdminRole[] = [
  { id: "admin-owner", userId: "user-owner", venueId: venue.id, kind: "owner" },
  { id: "admin-staff", userId: "user-staff", venueId: venue.id, kind: "staff" },
];

export const slotTemplates: SlotTemplate[] = [
  {
    id: "template-sunrise",
    name: "Sunrise Rally",
    durationMinutes: 60,
    confirmationMode: "instant",
    paymentMode: "online",
    priceInr: 700,
    description: "Fast morning bookings designed to fill before work.",
  },
  {
    id: "template-prime",
    name: "Prime-Time Court",
    durationMinutes: 60,
    confirmationMode: "instant",
    paymentMode: "hybrid",
    priceInr: 900,
    description: "High-demand evening court with member perks and wallet support.",
  },
  {
    id: "template-club",
    name: "Club Hold",
    durationMinutes: 60,
    confirmationMode: "review",
    paymentMode: "pay_at_venue",
    priceInr: 850,
    description: "Manually reviewed holds for staff-led or high-touch requests.",
  },
];

export const bookableSlots: BookableSlot[] = [
  {
    id: "slot-1",
    templateId: "template-sunrise",
    courtId: "court-1",
    startsAt: "2026-04-02T06:00:00+05:30",
    endsAt: "2026-04-02T07:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 700,
    paymentMode: "online",
    confirmationMode: "instant",
    availabilityState: "open",
    label: "Sunrise Rally",
  },
  {
    id: "slot-2",
    templateId: "template-sunrise",
    courtId: "court-2",
    startsAt: "2026-04-02T06:00:00+05:30",
    endsAt: "2026-04-02T07:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 700,
    paymentMode: "online",
    confirmationMode: "instant",
    availabilityState: "limited",
    label: "Sunrise Rally",
  },
  {
    id: "slot-3",
    templateId: "template-prime",
    courtId: "court-3",
    startsAt: "2026-04-02T18:00:00+05:30",
    endsAt: "2026-04-02T19:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 900,
    paymentMode: "hybrid",
    confirmationMode: "instant",
    availabilityState: "open",
    label: "Prime-Time Court",
  },
  {
    id: "slot-4",
    templateId: "template-prime",
    courtId: "court-4",
    startsAt: "2026-04-02T19:00:00+05:30",
    endsAt: "2026-04-02T20:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 950,
    paymentMode: "hybrid",
    confirmationMode: "instant",
    availabilityState: "open",
    label: "Golden Hour Court",
  },
  {
    id: "slot-5",
    templateId: "template-club",
    courtId: "court-5",
    startsAt: "2026-04-03T07:00:00+05:30",
    endsAt: "2026-04-03T08:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 850,
    paymentMode: "pay_at_venue",
    confirmationMode: "review",
    availabilityState: "open",
    label: "Coach Hold",
  },
  {
    id: "slot-6",
    templateId: "template-prime",
    courtId: "court-2",
    startsAt: "2026-04-03T18:00:00+05:30",
    endsAt: "2026-04-03T19:00:00+05:30",
    durationMinutes: 60,
    capacity: 4,
    priceInr: 900,
    paymentMode: "hybrid",
    confirmationMode: "instant",
    availabilityState: "limited",
    label: "Prime-Time Court",
  },
];

export const bookings: Booking[] = [
  {
    id: "booking-1",
    slotId: "slot-3",
    customerId: "customer-rhea",
    bookedAt: "2026-03-31T09:30:00+05:30",
    status: "confirmed",
    paymentStatus: "credit_applied",
    attendees: 4,
  },
  {
    id: "booking-2",
    slotId: "slot-4",
    customerId: "customer-arav",
    bookedAt: "2026-03-30T11:00:00+05:30",
    status: "confirmed",
    paymentStatus: "paid_online",
    attendees: 4,
  },
  {
    id: "booking-3",
    slotId: "slot-2",
    customerId: "customer-meera",
    bookedAt: "2026-03-29T08:00:00+05:30",
    status: "requested",
    paymentStatus: "pending",
    attendees: 2,
  },
  {
    id: "booking-4",
    slotId: "slot-5",
    customerId: "customer-tara",
    bookedAt: "2026-03-29T13:00:00+05:30",
    status: "requested",
    paymentStatus: "pay_at_venue",
    attendees: 2,
  },
  {
    id: "booking-5",
    slotId: "slot-6",
    customerId: "customer-kabir",
    bookedAt: "2026-03-27T08:00:00+05:30",
    status: "completed",
    paymentStatus: "paid_online",
    attendees: 4,
  },
  {
    id: "booking-6",
    slotId: "slot-1",
    customerId: "customer-arav",
    bookedAt: "2026-03-23T08:00:00+05:30",
    status: "completed",
    paymentStatus: "paid_online",
    attendees: 4,
  },
  {
    id: "booking-7",
    slotId: "slot-3",
    customerId: "customer-meera",
    bookedAt: "2026-03-10T08:00:00+05:30",
    status: "canceled",
    paymentStatus: "credit_applied",
    attendees: 4,
  },
];

export const bookingPayments: BookingPayment[] = [
  { id: "payment-1", bookingId: "booking-1", amountInr: 600, mode: "wallet", status: "credit_applied" },
  { id: "payment-2", bookingId: "booking-2", amountInr: 900, mode: "online", status: "paid_online" },
  { id: "payment-3", bookingId: "booking-4", amountInr: 850, mode: "pay_at_venue", status: "pay_at_venue" },
];

export const packProducts: PackProduct[] = [
  {
    id: "pack-weekday",
    name: "Weekday Five",
    priceInr: 3000,
    includedCredits: 5,
    validDays: 30,
    description: "For players who mostly book before or after work.",
  },
  {
    id: "pack-sunset",
    name: "Sunset Eight",
    priceInr: 5200,
    includedCredits: 8,
    validDays: 45,
    description: "Built to keep evening courts full without discounting the whole calendar.",
  },
];

export const membershipPlans: MembershipPlan[] = [
  {
    id: "membership-club",
    name: "Club Pass",
    monthlyPriceInr: 1799,
    includedCredits: 2,
    perks: ["Priority booking on prime-time holds", "10% lower member rate", "Exclusive sunrise offers"],
  },
  {
    id: "membership-founder",
    name: "Founding Circle",
    monthlyPriceInr: 2999,
    includedCredits: 4,
    perks: ["Four monthly credits", "Guest-day unlocks", "Priority support and event holds"],
  },
];

export const customerPacks: CustomerPack[] = [
  {
    id: "customer-pack-1",
    customerId: "customer-rhea",
    productId: "pack-weekday",
    creditsRemaining: 2,
    expiresAt: "2026-04-15T23:59:00+05:30",
  },
  {
    id: "customer-pack-2",
    customerId: "customer-meera",
    productId: "pack-sunset",
    creditsRemaining: 1,
    expiresAt: "2026-04-06T23:59:00+05:30",
  },
];

export const customerMemberships: CustomerMembership[] = [
  {
    id: "customer-membership-1",
    customerId: "customer-rhea",
    planId: "membership-club",
    status: "active",
    renewsAt: "2026-04-18T23:59:00+05:30",
  },
  {
    id: "customer-membership-2",
    customerId: "customer-kabir",
    planId: "membership-founder",
    status: "active",
    renewsAt: "2026-04-09T23:59:00+05:30",
  },
];

export const walletLedgerEntries: WalletLedgerEntry[] = [
  {
    id: "wallet-1",
    customerId: "customer-rhea",
    createdAt: "2026-03-18T09:00:00+05:30",
    amountInr: 500,
    kind: "membership_benefit_credit",
    note: "Club Pass monthly credits",
  },
  {
    id: "wallet-2",
    customerId: "customer-rhea",
    createdAt: "2026-03-25T10:30:00+05:30",
    amountInr: 200,
    kind: "promo_credit",
    note: "Sunrise retention offer redeemed",
  },
  {
    id: "wallet-3",
    customerId: "customer-rhea",
    createdAt: "2026-03-31T09:30:00+05:30",
    amountInr: -600,
    kind: "credit_spent",
    note: "Applied to Prime-Time Court booking",
  },
  {
    id: "wallet-4",
    customerId: "customer-meera",
    createdAt: "2026-03-12T10:30:00+05:30",
    amountInr: 700,
    kind: "refund_credit",
    note: "Late-rain credit instead of cash refund",
  },
];

export const offers: Offer[] = [
  {
    id: "offer-sunrise",
    name: "Sunrise Revival",
    status: "active",
    startsAt: "2026-03-28T00:00:00+05:30",
    endsAt: "2026-04-10T23:59:00+05:30",
    headline: "Come back before 8 AM and unlock INR 200 in venue credit.",
    audience: "Players inactive for 10+ days",
    redemptionCap: 40,
    slotScope: "Sunrise and weekday early windows",
  },
  {
    id: "offer-member",
    name: "Member Guest Friday",
    status: "active",
    startsAt: "2026-04-01T00:00:00+05:30",
    endsAt: "2026-04-30T23:59:00+05:30",
    headline: "Members can bring a guest at the weekday member rate.",
    audience: "Active memberships",
    redemptionCap: 20,
    slotScope: "Friday evenings",
  },
  {
    id: "offer-launch",
    name: "Founding Pack Drop",
    status: "scheduled",
    startsAt: "2026-04-07T00:00:00+05:30",
    endsAt: "2026-04-21T23:59:00+05:30",
    headline: "Launch pack with eight sunset credits and one guest unlock.",
    audience: "Everyone",
    redemptionCap: 60,
    slotScope: "Sunset slots",
  },
];

export const offerRedemptions: OfferRedemption[] = [
  {
    id: "redemption-1",
    offerId: "offer-sunrise",
    customerId: "customer-rhea",
    redeemedAt: "2026-03-25T10:00:00+05:30",
    creditValueInr: 200,
  },
  {
    id: "redemption-2",
    offerId: "offer-sunrise",
    customerId: "customer-tara",
    redeemedAt: "2026-03-30T17:00:00+05:30",
    creditValueInr: 200,
  },
];

export const attendanceEvents: AttendanceEvent[] = [
  {
    id: "attendance-1",
    bookingId: "booking-5",
    customerId: "customer-kabir",
    attendedAt: "2026-03-27T19:10:00+05:30",
  },
  {
    id: "attendance-2",
    bookingId: "booking-6",
    customerId: "customer-arav",
    attendedAt: "2026-03-23T06:58:00+05:30",
  },
  {
    id: "attendance-3",
    bookingId: "booking-1",
    customerId: "customer-rhea",
    attendedAt: "2026-03-20T07:04:00+05:30",
  },
];

export const customerNotes: CustomerNote[] = [
  {
    id: "note-1",
    customerId: "customer-meera",
    authoredBy: "Naina Joshi",
    createdAt: "2026-03-30T11:30:00+05:30",
    body: "Has one sunset credit left. Good candidate for sunrise recovery offer.",
  },
  {
    id: "note-2",
    customerId: "customer-kabir",
    authoredBy: "Aarav Yadav",
    createdAt: "2026-03-28T18:00:00+05:30",
    body: "Brings guests often. Invite to early founding-circle preview.",
  },
];

function getUserByCustomerId(customerId: string) {
  const profile = customerProfiles.find((entry) => entry.id === customerId);
  return users.find((user) => user.id === profile?.userId);
}

function getSlotById(slotId: string) {
  return bookableSlots.find((slot) => slot.id === slotId);
}

export const highlightedSlots = bookableSlots.slice(0, 4);
export const customerPreviewProfile = customerProfiles.find((profile) => profile.id === PREVIEW_CUSTOMER_ID)!;
export const customerPreviewUser = getUserByCustomerId(PREVIEW_CUSTOMER_ID)!;
export const customerPreviewUpcomingBookings = bookings
  .filter((booking) => booking.customerId === PREVIEW_CUSTOMER_ID && ["requested", "confirmed"].includes(booking.status))
  .map((booking) => ({ booking, slot: getSlotById(booking.slotId)! }));

export const customerPreviewPack = customerPacks.find((pack) => pack.customerId === PREVIEW_CUSTOMER_ID)!;
export const customerPreviewMembership = customerMemberships.find(
  (membership) => membership.customerId === PREVIEW_CUSTOMER_ID,
)!;

export const walletBalance = walletLedgerEntries
  .filter((entry) => entry.customerId === PREVIEW_CUSTOMER_ID)
  .reduce((total, entry) => total + entry.amountInr, 0);

export const adminSummary = {
  occupancyRate:
    (bookings.filter((booking) => ["confirmed", "completed"].includes(booking.status)).length / bookableSlots.length) *
    100,
  repeatPlayRate:
    (customerProfiles.filter((profile) => bookings.filter((booking) => booking.customerId === profile.id).length > 1).length /
      customerProfiles.length) *
    100,
  creditsExpiringSoon: customerPacks.filter(
    (pack) =>
      new Date(pack.expiresAt).getTime() - venueNow.getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length,
  offersRedeemedThisCycle: offerRedemptions.length,
};

export const atRiskCustomers = customerProfiles
  .map((profile) => {
    const lastAttendance = attendanceEvents
      .filter((entry) => entry.customerId === profile.id)
      .map((entry) => new Date(entry.attendedAt).getTime())
      .sort((first, second) => second - first)[0];
    const nextBooking = bookings.find(
      (booking) =>
        booking.customerId === profile.id &&
        ["requested", "confirmed"].includes(booking.status) &&
        new Date(getSlotById(booking.slotId)!.startsAt).getTime() > venueNow.getTime(),
    );

    return {
      profile,
      user: getUserByCustomerId(profile.id)!,
      daysSinceLastAttendance: lastAttendance
        ? Math.floor((venueNow.getTime() - lastAttendance) / (24 * 60 * 60 * 1000))
        : 99,
      hasUpcomingBooking: Boolean(nextBooking),
      note: customerNotes.find((note) => note.customerId === profile.id),
    };
  })
  .filter((entry) => entry.daysSinceLastAttendance >= 7 && !entry.hasUpcomingBooking)
  .sort((first, second) => second.daysSinceLastAttendance - first.daysSinceLastAttendance)
  .slice(0, 3);

export const operatorFeed = [
  "Move one review-based club hold to Court 05 for Friday morning.",
  "Nudge Meera Rawat before her sunset pack expires in 5 days.",
  "Push Sunrise Revival to members who have not played in 10+ days.",
  "Spot-check the 6:00 AM occupancy trend before opening another early block.",
];

export const adminCustomers = customerProfiles.map((profile) => {
  const user = getUserByCustomerId(profile.id)!;
  const totalBookings = bookings.filter((booking) => booking.customerId === profile.id).length;
  const membership = customerMemberships.find((entry) => entry.customerId === profile.id);
  const pack = customerPacks.find((entry) => entry.customerId === profile.id);

  return {
    id: profile.id,
    name: user.name,
    favoriteWindow: profile.favoriteWindow,
    tags: profile.tags,
    totalBookings,
    membership: membership ? membershipPlans.find((plan) => plan.id === membership.planId)?.name : "No membership",
    creditsRemaining: pack?.creditsRemaining ?? 0,
  };
});
