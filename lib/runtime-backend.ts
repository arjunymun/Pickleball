import {
  createSeedDemoState,
  getAdminDashboard,
  getCustomerExperience,
  type AdminDashboardSnapshot,
  type CustomerExperienceSnapshot,
} from "@/lib/demo-state";
import type {
  AdminRole,
  AttendanceEvent,
  Booking,
  BookableSlot,
  Court,
  CustomerMembership,
  CustomerNote,
  CustomerPack,
  CustomerProfile,
  MembershipPlan,
  Offer,
  OfferRedemption,
  PackProduct,
  SlotTemplate,
  User,
  Venue,
  WalletLedgerEntry,
} from "@/lib/domain";
import type { RuntimeSnapshot } from "@/lib/runtime-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const RUNTIME_NOW = "2026-04-02T08:00:00+05:30";

function getDemoSnapshot(): RuntimeSnapshot {
  const state = createSeedDemoState();

  return {
    source: "demo",
    customerExperience: getCustomerExperience(state),
    adminDashboard: getAdminDashboard(state),
    capabilities: {
      customerLive: false,
      adminLive: false,
    },
  };
}

function mapVenueRow(row: Record<string, unknown>): Venue {
  return {
    id: String(row.id),
    name: String(row.name),
    tagline: String(row.tagline),
    location: String(row.location),
    timezone: String(row.timezone),
    story: String(row.story),
  };
}

function mapCourtRow(row: Record<string, unknown>): Court {
  return {
    id: String(row.id),
    name: String(row.name),
    surface: String(row.surface),
    lighting: Boolean(row.lighting),
    outlook: String(row.outlook),
  };
}

function mapUserRow(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.full_name),
    email: String(row.email),
    phone: typeof row.phone === "string" ? row.phone : "",
  };
}

function mapCustomerProfileRow(row: Record<string, unknown>): CustomerProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    joinedAt: String(row.joined_at),
    favoriteWindow: typeof row.favorite_window === "string" && row.favorite_window.length > 0 ? row.favorite_window : "Flexible",
    skillBand: typeof row.skill_band === "string" && row.skill_band.length > 0 ? row.skill_band : "All levels",
    tags: Array.isArray(row.tags) ? row.tags.map((tag) => String(tag)) : [],
  };
}

function mapAdminRoleRow(row: Record<string, unknown>): AdminRole {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    venueId: String(row.venue_id),
    kind: row.kind === "owner" ? "owner" : "staff",
  };
}

function mapSlotTemplateRow(row: Record<string, unknown>): SlotTemplate {
  return {
    id: String(row.id),
    name: String(row.name),
    durationMinutes: Number(row.duration_minutes),
    confirmationMode: row.confirmation_mode === "review" ? "review" : "instant",
    paymentMode:
      row.payment_mode === "pay_at_venue" || row.payment_mode === "hybrid" ? row.payment_mode : "online",
    priceInr: Number(row.price_inr),
    description: String(row.description),
  };
}

function mapBookableSlotRow(row: Record<string, unknown>): BookableSlot {
  return {
    id: String(row.id),
    templateId: String(row.template_id),
    courtId: String(row.court_id),
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    durationMinutes: Number(row.duration_minutes),
    capacity: Number(row.capacity),
    priceInr: Number(row.price_inr),
    paymentMode:
      row.payment_mode === "pay_at_venue" || row.payment_mode === "hybrid" ? row.payment_mode : "online",
    confirmationMode: row.confirmation_mode === "review" ? "review" : "instant",
    availabilityState:
      row.availability_state === "limited" || row.availability_state === "booked" ? row.availability_state : "open",
    label: String(row.label),
  };
}

function mapBookingRow(row: Record<string, unknown>): Booking {
  return {
    id: String(row.id),
    slotId: String(row.slot_id),
    customerId: String(row.customer_id),
    bookedAt: String(row.booked_at),
    status:
      row.status === "requested" ||
      row.status === "confirmed" ||
      row.status === "canceled" ||
      row.status === "completed" ||
      row.status === "no_show" ||
      row.status === "credited"
        ? row.status
        : "requested",
    paymentStatus:
      row.payment_status === "paid_online" || row.payment_status === "pay_at_venue" || row.payment_status === "credit_applied"
        ? row.payment_status
        : "pending",
    attendees: Number(row.attendees),
  };
}

function mapPackProductRow(row: Record<string, unknown>): PackProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    priceInr: Number(row.price_inr),
    includedCredits: Number(row.included_credits),
    validDays: Number(row.valid_days),
    description: String(row.description),
  };
}

function mapMembershipPlanRow(row: Record<string, unknown>): MembershipPlan {
  return {
    id: String(row.id),
    name: String(row.name),
    monthlyPriceInr: Number(row.monthly_price_inr),
    includedCredits: Number(row.included_credits),
    perks: Array.isArray(row.perks) ? row.perks.map((perk) => String(perk)) : [],
  };
}

function mapCustomerPackRow(row: Record<string, unknown>): CustomerPack {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    productId: String(row.product_id),
    creditsRemaining: Number(row.credits_remaining),
    expiresAt: String(row.expires_at),
  };
}

function mapCustomerMembershipRow(row: Record<string, unknown>): CustomerMembership {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    planId: String(row.plan_id),
    status: row.status === "paused" || row.status === "expired" ? row.status : "active",
    renewsAt: String(row.renews_at),
  };
}

function mapWalletEntryRow(row: Record<string, unknown>): WalletLedgerEntry {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    createdAt: String(row.created_at),
    amountInr: Number(row.amount_inr),
    kind:
      row.kind === "credit_spent" ||
      row.kind === "pack_restored" ||
      row.kind === "promo_credit" ||
      row.kind === "membership_benefit_credit" ||
      row.kind === "manual_adjustment" ||
      row.kind === "refund_credit"
        ? row.kind
        : "credit_added",
    note: String(row.note),
  };
}

function mapOfferRow(row: Record<string, unknown>): Offer {
  return {
    id: String(row.id),
    name: String(row.name),
    status: row.status === "scheduled" || row.status === "expired" ? row.status : "active",
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    headline: String(row.headline),
    audience: String(row.audience),
    redemptionCap: Number(row.redemption_cap),
    slotScope: String(row.slot_scope),
  };
}

function mapOfferRedemptionRow(row: Record<string, unknown>): OfferRedemption {
  return {
    id: String(row.id),
    offerId: String(row.offer_id),
    customerId: String(row.customer_id),
    redeemedAt: String(row.redeemed_at),
    creditValueInr: Number(row.credit_value_inr),
  };
}

function mapAttendanceRow(row: Record<string, unknown>): AttendanceEvent {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    customerId: String(row.customer_id),
    attendedAt: String(row.attended_at),
  };
}

function mapCustomerNoteRow(row: Record<string, unknown>): CustomerNote {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    authoredBy: String(row.authored_by),
    createdAt: String(row.created_at),
    body: String(row.body),
  };
}

function getWalletBalance(walletEntries: WalletLedgerEntry[], customerId: string) {
  return walletEntries
    .filter((entry) => entry.customerId === customerId)
    .reduce((total, entry) => total + entry.amountInr, 0);
}

function daysSince(value: string | null | undefined) {
  if (!value) {
    return 99;
  }

  return Math.floor(
    (new Date(RUNTIME_NOW).getTime() - new Date(value).getTime()) / (24 * 60 * 60 * 1000),
  );
}

function buildCustomerExperienceFromRemote(params: {
  customerProfile: CustomerProfile;
  user: User;
  slots: BookableSlot[];
  bookings: Booking[];
  walletEntries: WalletLedgerEntry[];
  packProducts: PackProduct[];
  membershipPlans: MembershipPlan[];
  customerPacks: CustomerPack[];
  customerMemberships: CustomerMembership[];
}): CustomerExperienceSnapshot {
  const {
    bookings,
    customerMemberships,
    customerPacks,
    customerProfile,
    membershipPlans,
    packProducts,
    slots,
    user,
    walletEntries,
  } = params;

  const activeBookings = bookings.filter((booking) => ["requested", "confirmed"].includes(booking.status));
  const ownActiveBookingsBySlot = new Map(activeBookings.map((booking) => [booking.slotId, booking]));
  const walletBalance = getWalletBalance(walletEntries, customerProfile.id);

  const upcomingBookings = activeBookings
    .map((booking) => ({
      booking,
      slot: slots.find((slot) => slot.id === booking.slotId)!,
    }))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );

  const slotCards = slots.map((slot) => {
    const ownedBooking = ownActiveBookingsBySlot.get(slot.id);
    const blockedByOther = slot.availabilityState === "booked" && !ownedBooking;
    const canUseWallet = walletBalance >= slot.priceInr && slot.paymentMode !== "pay_at_venue";
    const canBook = !ownedBooking && !blockedByOther;

    let cta = "Booked";
    if (ownedBooking) {
      cta = "Your booking";
    } else if (canBook && slot.confirmationMode === "review") {
      cta = "Request hold";
    } else if (canBook && canUseWallet) {
      cta = "Book with credits";
    } else if (canBook) {
      cta = "Book now";
    }

    return {
      slot,
      blockingBooking: ownedBooking,
      isOwnedByCustomer: Boolean(ownedBooking),
      canBook,
      canUseWallet,
      cta,
    };
  });

  const packSnapshot = customerPacks.find((entry) => entry.customerId === customerProfile.id) ?? null;
  const membershipSnapshot = customerMemberships.find((entry) => entry.customerId === customerProfile.id) ?? null;

  return {
    profile: customerProfile,
    user,
    walletBalance,
    walletEntries: [...walletEntries].sort(
      (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    ),
    pack: packSnapshot ? packProducts.find((entry) => entry.id === packSnapshot.productId) ?? null : null,
    packSnapshot,
    membership: membershipSnapshot
      ? membershipPlans.find((entry) => entry.id === membershipSnapshot.planId) ?? null
      : null,
    membershipSnapshot,
    upcomingBookings,
    slots: slotCards,
  };
}

function buildAdminDashboardFromRemote(params: {
  venue: Venue;
  courts: Court[];
  slotTemplates: SlotTemplate[];
  adminRoles: AdminRole[];
  offers: Offer[];
  offerRedemptions: OfferRedemption[];
  customerProfiles: CustomerProfile[];
  users: User[];
  slots: BookableSlot[];
  bookings: Booking[];
  customerPacks: CustomerPack[];
  customerMemberships: CustomerMembership[];
  membershipPlans: MembershipPlan[];
  walletEntries: WalletLedgerEntry[];
  attendanceEvents: AttendanceEvent[];
  customerNotes: CustomerNote[];
}): AdminDashboardSnapshot {
  const {
    adminRoles,
    attendanceEvents,
    bookings,
    courts,
    customerMemberships,
    customerNotes,
    customerPacks,
    customerProfiles,
    membershipPlans,
    offerRedemptions,
    offers,
    slotTemplates,
    slots,
    users,
    venue,
    walletEntries,
  } = params;

  const userById = new Map(users.map((user) => [user.id, user]));
  const slotById = new Map(slots.map((slot) => [slot.id, slot]));
  const courtById = new Map(courts.map((court) => [court.id, court]));
  const customerProfileById = new Map(customerProfiles.map((profile) => [profile.id, profile]));

  const confirmedOrCompleted = bookings.filter((booking) => ["confirmed", "completed"].includes(booking.status));
  const repeatPlayCount = customerProfiles.filter(
    (profile) => bookings.filter((booking) => booking.customerId === profile.id).length > 1,
  ).length;

  const creditsExpiringSoon = customerPacks.filter(
    (pack) => new Date(pack.expiresAt).getTime() - new Date(RUNTIME_NOW).getTime() < 7 * 24 * 60 * 60 * 1000,
  ).length;

  const requestQueue = bookings
    .filter((booking) => booking.status === "requested")
    .map((booking) => {
      const slot = slotById.get(booking.slotId);
      const profile = customerProfiles.find((entry) => entry.id === booking.customerId);
      const user = profile ? userById.get(profile.userId) : null;

      return slot && user
        ? {
            booking,
            slot,
            customer: user,
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );

  const upcomingConfirmed = bookings
    .filter((booking) => booking.status === "confirmed")
    .map((booking) => {
      const slot = slotById.get(booking.slotId);
      const profile = customerProfiles.find((entry) => entry.id === booking.customerId);
      const user = profile ? userById.get(profile.userId) : null;

      return slot && user
        ? {
            booking,
            slot,
            customer: user,
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort(
      (first, second) =>
        new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
    );

  const atRiskCustomers = customerProfiles
    .map((profile) => {
      const lastAttendance = attendanceEvents
        .filter((event) => event.customerId === profile.id)
        .map((event) => event.attendedAt)
        .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0];

      const hasUpcomingBooking = bookings.some(
        (booking) =>
          booking.customerId === profile.id && ["requested", "confirmed"].includes(booking.status),
      );

      const user = userById.get(profile.userId);
      if (!user) {
        return null;
      }

      return {
        profile,
        user,
        daysSinceLastAttendance: daysSince(lastAttendance),
        note: customerNotes.find((entry) => entry.customerId === profile.id) ?? null,
        hasUpcomingBooking,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .filter((entry) => entry.daysSinceLastAttendance >= 7 && !entry.hasUpcomingBooking)
    .sort((first, second) => second.daysSinceLastAttendance - first.daysSinceLastAttendance)
    .slice(0, 4);

  const customers = customerProfiles
    .map((profile) => {
      const user = userById.get(profile.userId);
      if (!user) {
        return null;
      }

      const membership = customerMemberships.find((entry) => entry.customerId === profile.id);
      const membershipName = membership
        ? membershipPlans.find((entry) => entry.id === membership.planId)?.name ?? "Membership"
        : "No membership";

      const nextBooking =
        bookings
          .filter(
            (booking) =>
              booking.customerId === profile.id && ["requested", "confirmed"].includes(booking.status),
          )
          .map((booking) => ({
            booking,
            slot: slotById.get(booking.slotId)!,
          }))
          .filter((entry) => Boolean(entry.slot))
          .sort(
            (first, second) =>
              new Date(first.slot.startsAt).getTime() - new Date(second.slot.startsAt).getTime(),
          )[0] ?? null;

      const lastAttendance = attendanceEvents
        .filter((event) => event.customerId === profile.id)
        .map((event) => event.attendedAt)
        .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0];

      return {
        id: profile.id,
        name: user.name,
        favoriteWindow: profile.favoriteWindow,
        totalBookings: bookings.filter((booking) => booking.customerId === profile.id).length,
        membership: membershipName,
        creditsRemaining: getWalletBalance(walletEntries, profile.id),
        tags: profile.tags,
        note: customerNotes.find((entry) => entry.customerId === profile.id) ?? null,
        nextBooking,
        daysSinceLastAttendance: daysSince(lastAttendance),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const schedule = slots.map((slot) => {
    const blockingBooking =
      bookings.find(
        (booking) =>
          booking.slotId === slot.id && ["requested", "confirmed"].includes(booking.status),
      ) ?? null;

    const blockingProfile = blockingBooking ? customerProfileById.get(blockingBooking.customerId) : null;
    const blockingUser = blockingProfile ? userById.get(blockingProfile.userId) : null;

    return {
      slot,
      blockingBooking,
      effectiveAvailability: blockingBooking ? "booked" : slot.availabilityState,
      customerName: blockingUser?.name ?? null,
      court: courtById.get(slot.courtId) ?? null,
    };
  });

  return {
    venue,
    courts,
    slotTemplates,
    adminRoles,
    offers,
    schedule,
    metrics: {
      repeatPlayRate: customerProfiles.length > 0 ? (repeatPlayCount / customerProfiles.length) * 100 : 0,
      occupancyRate: slots.length > 0 ? (confirmedOrCompleted.length / slots.length) * 100 : 0,
      creditsExpiringSoon,
      offersRedeemed: offerRedemptions.length,
    },
    requestQueue,
    upcomingConfirmed,
    atRiskCustomers,
    customers,
  };
}

export async function getSupabaseRuntimeSnapshot(): Promise<RuntimeSnapshot> {
  const demoSnapshot = getDemoSnapshot();
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return demoSnapshot;
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return demoSnapshot;
  }

  const { data: appUserRow } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!appUserRow) {
    return demoSnapshot;
  }

  const { data: customerProfileRowsRaw } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("user_id", appUserRow.id);

  const { data: adminRoleRowsRaw } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("user_id", appUserRow.id);

  const customerProfileRows = customerProfileRowsRaw ?? [];
  const adminRoleRows = adminRoleRowsRaw ?? [];

  const activeVenueId =
    (customerProfileRows[0]?.venue_id as string | undefined) ??
    (adminRoleRows[0]?.venue_id as string | undefined);

  if (!activeVenueId) {
    return demoSnapshot;
  }

  const [
    venueResult,
    courtsResult,
    slotTemplatesResult,
    slotsResult,
    offersResult,
    packProductsResult,
    membershipPlansResult,
  ] = await Promise.all([
    supabase.from("venues").select("*").eq("id", activeVenueId).maybeSingle(),
    supabase.from("courts").select("*").eq("venue_id", activeVenueId),
    supabase.from("slot_templates").select("*").eq("venue_id", activeVenueId),
    supabase.from("bookable_slots").select("*").eq("venue_id", activeVenueId).order("starts_at", { ascending: true }),
    supabase.from("offers").select("*").eq("venue_id", activeVenueId).order("starts_at", { ascending: true }),
    supabase.from("pack_products").select("*").eq("venue_id", activeVenueId),
    supabase.from("membership_plans").select("*").eq("venue_id", activeVenueId),
  ]);

  if (!venueResult.data || !slotsResult.data) {
    return demoSnapshot;
  }

  const venue = mapVenueRow(venueResult.data as Record<string, unknown>);
  const courts = (courtsResult.data ?? []).map((row) => mapCourtRow(row as Record<string, unknown>));
  const slotTemplates = (slotTemplatesResult.data ?? []).map((row) => mapSlotTemplateRow(row as Record<string, unknown>));
  const slots = (slotsResult.data ?? []).map((row) => mapBookableSlotRow(row as Record<string, unknown>));
  const offers = (offersResult.data ?? []).map((row) => mapOfferRow(row as Record<string, unknown>));
  const packProducts = (packProductsResult.data ?? []).map((row) => mapPackProductRow(row as Record<string, unknown>));
  const membershipPlans = (membershipPlansResult.data ?? []).map((row) =>
    mapMembershipPlanRow(row as Record<string, unknown>),
  );

  const customerProfileRow = customerProfileRows[0] as Record<string, unknown> | undefined;
  const customerProfile = customerProfileRow ? mapCustomerProfileRow(customerProfileRow) : null;
  const currentUser = mapUserRow(appUserRow as Record<string, unknown>);
  const adminRoles = adminRoleRows.map((row) => mapAdminRoleRow(row as Record<string, unknown>));

  let customerExperience: CustomerExperienceSnapshot | null = null;
  if (customerProfile) {
    const [bookingsResult, walletEntriesResult, customerPacksResult, customerMembershipsResult] = await Promise.all([
      supabase.from("bookings").select("*").eq("customer_id", customerProfile.id).order("booked_at", { ascending: false }),
      supabase.from("wallet_ledger_entries").select("*").eq("customer_id", customerProfile.id).order("created_at", { ascending: false }),
      supabase.from("customer_packs").select("*").eq("customer_id", customerProfile.id),
      supabase.from("customer_memberships").select("*").eq("customer_id", customerProfile.id),
    ]);

    customerExperience = buildCustomerExperienceFromRemote({
      customerProfile,
      user: currentUser,
      slots,
      bookings: (bookingsResult.data ?? []).map((row) => mapBookingRow(row as Record<string, unknown>)),
      walletEntries: (walletEntriesResult.data ?? []).map((row) => mapWalletEntryRow(row as Record<string, unknown>)),
      packProducts,
      membershipPlans,
      customerPacks: (customerPacksResult.data ?? []).map((row) => mapCustomerPackRow(row as Record<string, unknown>)),
      customerMemberships: (customerMembershipsResult.data ?? []).map((row) =>
        mapCustomerMembershipRow(row as Record<string, unknown>),
      ),
    });
  }

  let adminDashboard: AdminDashboardSnapshot | null = null;
  if (adminRoles.length > 0) {
    const [
      customerProfilesResult,
      usersResult,
      bookingsResult,
      customerPacksResult,
      customerMembershipsResult,
      walletEntriesResult,
      attendanceEventsResult,
      customerNotesResult,
      offerRedemptionsResult,
    ] = await Promise.all([
      supabase.from("customer_profiles").select("*").eq("venue_id", activeVenueId),
      supabase.from("users").select("*"),
      supabase.from("bookings").select("*"),
      supabase.from("customer_packs").select("*"),
      supabase.from("customer_memberships").select("*"),
      supabase.from("wallet_ledger_entries").select("*"),
      supabase.from("attendance_events").select("*"),
      supabase.from("customer_notes").select("*"),
      supabase.from("offer_redemptions").select("*"),
    ]);

    const customerProfiles = (customerProfilesResult.data ?? []).map((row) =>
      mapCustomerProfileRow(row as Record<string, unknown>),
    );
    const allowedCustomerIds = new Set(customerProfiles.map((profile) => profile.id));
    const slotIds = new Set(slots.map((slot) => slot.id));

    const bookings = (bookingsResult.data ?? [])
      .map((row) => mapBookingRow(row as Record<string, unknown>))
      .filter((booking) => allowedCustomerIds.has(booking.customerId) && slotIds.has(booking.slotId));

    const bookingIds = new Set(bookings.map((booking) => booking.id));

    adminDashboard = buildAdminDashboardFromRemote({
      venue,
      courts,
      slotTemplates,
      adminRoles,
      offers,
      offerRedemptions: (offerRedemptionsResult.data ?? [])
        .map((row) => mapOfferRedemptionRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId)),
      customerProfiles,
      users: (usersResult.data ?? []).map((row) => mapUserRow(row as Record<string, unknown>)),
      slots,
      bookings,
      customerPacks: (customerPacksResult.data ?? [])
        .map((row) => mapCustomerPackRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId)),
      customerMemberships: (customerMembershipsResult.data ?? [])
        .map((row) => mapCustomerMembershipRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId)),
      membershipPlans,
      walletEntries: (walletEntriesResult.data ?? [])
        .map((row) => mapWalletEntryRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId)),
      attendanceEvents: (attendanceEventsResult.data ?? [])
        .map((row) => mapAttendanceRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId) && bookingIds.has(entry.bookingId)),
      customerNotes: (customerNotesResult.data ?? [])
        .map((row) => mapCustomerNoteRow(row as Record<string, unknown>))
        .filter((entry) => allowedCustomerIds.has(entry.customerId)),
    });
  }

  return {
    source: "supabase",
    customerExperience: customerExperience ?? demoSnapshot.customerExperience,
    adminDashboard: adminDashboard ?? demoSnapshot.adminDashboard,
    capabilities: {
      customerLive: Boolean(customerExperience),
      adminLive: Boolean(adminDashboard),
    },
  };
}
