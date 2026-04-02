import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const INDIA_TIMEZONE = "Asia/Kolkata";

function getAuthUserName(authUser: SupabaseAuthUser) {
  const metadataName = authUser.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  if (authUser.email) {
    return authUser.email.split("@")[0] || "Sideout Owner";
  }

  if (authUser.phone) {
    return authUser.phone;
  }

  return "Sideout Owner";
}

function formatIndiaDateFromOffset(dayOffset: number) {
  const probe = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: INDIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(probe);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Could not derive India-local calendar date.");
  }

  return `${year}-${month}-${day}`;
}

function buildIndiaTimestamp(baseDayOffset: number, time: string) {
  const calendarDate = formatIndiaDateFromOffset(baseDayOffset);
  return new Date(`${calendarDate}T${time}:00+05:30`).toISOString();
}

async function upsertAppUser(options: {
  authUserId?: string;
  fullName: string;
  email: string;
  phone?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const payload = {
    auth_user_id: options.authUserId ?? null,
    full_name: options.fullName,
    email: options.email,
    phone: options.phone ?? null,
  };

  const { data, error } = await admin
    .from("users")
    .upsert([payload], { onConflict: "email" })
    .select("id,email")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? `Failed to upsert app user ${options.email}.`);
  }

  return data.id as string;
}

export async function bootstrapLiveVenueForAuthUser(authUser: SupabaseAuthUser) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  if (!authUser.email) {
    throw new Error("A verified email is required to initialize the live venue owner.");
  }

  const ownerUserId = await upsertAppUser({
    authUserId: authUser.id,
    fullName: getAuthUserName(authUser),
    email: authUser.email,
    phone: authUser.phone,
  });

  const existingAdminRole = await admin
    .from("admin_roles")
    .select("venue_id")
    .eq("user_id", ownerUserId)
    .limit(1)
    .maybeSingle();

  if (existingAdminRole.error) {
    throw new Error(existingAdminRole.error.message);
  }

  if (existingAdminRole.data?.venue_id) {
    return {
      message: "Live Sideout venue is already initialized for this account.",
      venueId: existingAdminRole.data.venue_id as string,
      created: false,
    };
  }

  const baseDayOffset = 1;

  const { data: venueRow, error: venueError } = await admin
    .from("venues")
    .insert({
      name: "Sideout Club",
      tagline: "Repeat-play software shaped from a real family-built venue.",
      location: "Dehradun, Uttarakhand",
      timezone: INDIA_TIMEZONE,
      story:
        "Five courts, warm foothill mornings, and a business that runs better when booking, retention, and member value live in one system.",
    })
    .select("id")
    .single();

  if (venueError || !venueRow) {
    throw new Error(venueError?.message ?? "Failed to create venue.");
  }

  const venueId = venueRow.id as string;

  const { error: venueSettingsError } = await admin.from("venue_settings").upsert(
    [
      {
        venue_id: venueId,
        cancellation_cutoff_hours: 6,
        booking_window_days: 14,
        reminder_lead_hours: [24, 2],
        public_contact_phone: authUser.phone ?? "+91 98765 43110",
        public_contact_email: authUser.email,
        public_whatsapp_number: authUser.phone ?? "+91 98765 43110",
        member_discount_percent: 10,
        featured_announcement:
          "Sunrise inventory is the cleanest place to win back off-rhythm regulars.",
      },
    ],
    { onConflict: "venue_id" },
  );

  if (venueSettingsError) {
    throw new Error(venueSettingsError.message);
  }

  const { error: adminRoleError } = await admin.from("admin_roles").upsert(
    [
      {
        user_id: ownerUserId,
        venue_id: venueId,
        kind: "owner",
      },
    ],
    { onConflict: "user_id,venue_id" },
  );

  if (adminRoleError) {
    throw new Error(adminRoleError.message);
  }

  const { data: ownerProfileRow, error: ownerProfileError } = await admin
    .from("customer_profiles")
    .upsert(
      [
        {
          user_id: ownerUserId,
          venue_id: venueId,
          favorite_window: "Sunrise",
          skill_band: "3.5 to 4.0",
          tags: ["owner", "member", "weekday regular"],
          phone_e164: authUser.phone ?? "+91 98765 43110",
          whatsapp_opt_in: true,
          communication_preference: "whatsapp",
        },
      ],
      { onConflict: "user_id,venue_id" },
    )
    .select("id")
    .single();

  if (ownerProfileError || !ownerProfileRow) {
    throw new Error(ownerProfileError?.message ?? "Failed to create owner customer profile.");
  }

  const ownerProfileId = ownerProfileRow.id as string;

  const staffUserId = await upsertAppUser({
    fullName: "Naina Joshi",
    email: "ops@sideout.club",
    phone: "+91 98765 43116",
  });

  const { error: staffRoleError } = await admin.from("admin_roles").upsert(
    [
      {
        user_id: staffUserId,
        venue_id: venueId,
        kind: "staff",
      },
    ],
    { onConflict: "user_id,venue_id" },
  );

  if (staffRoleError) {
    throw new Error(staffRoleError.message);
  }

  const customerSeeds = [
    {
      fullName: "Arav Sharma",
      email: "arav.demo@sideout.club",
      phone: "+91 98765 43111",
      favoriteWindow: "After work",
      skillBand: "4.0",
      tags: ["prime-time", "high LTV"],
      lastContactedAt: buildIndiaTimestamp(baseDayOffset - 3, "18:30"),
    },
    {
      fullName: "Meera Rawat",
      email: "meera.demo@sideout.club",
      phone: "+91 98765 43112",
      favoriteWindow: "Sunset",
      skillBand: "3.0",
      tags: ["pack holder", "at-risk"],
      lastContactedAt: buildIndiaTimestamp(baseDayOffset - 5, "09:10"),
    },
    {
      fullName: "Kabir Bansal",
      email: "kabir.demo@sideout.club",
      phone: "+91 98765 43113",
      favoriteWindow: "Weekend mornings",
      skillBand: "4.0+",
      tags: ["member", "brings guests"],
      lastContactedAt: buildIndiaTimestamp(baseDayOffset - 2, "19:00"),
    },
    {
      fullName: "Tara Mehta",
      email: "tara.demo@sideout.club",
      phone: "+91 98765 43114",
      favoriteWindow: "Flexible",
      skillBand: "Beginner",
      tags: ["new player", "promo-converted"],
      lastContactedAt: null,
    },
  ] as const;

  const customerProfiles = new Map<string, string>();

  for (const seed of customerSeeds) {
    const appUserId = await upsertAppUser({
      fullName: seed.fullName,
      email: seed.email,
      phone: seed.phone,
    });

    const { data, error } = await admin
      .from("customer_profiles")
      .upsert(
        [
          {
            user_id: appUserId,
            venue_id: venueId,
            favorite_window: seed.favoriteWindow,
            skill_band: seed.skillBand,
            tags: seed.tags,
            phone_e164: seed.phone,
            whatsapp_opt_in: true,
            communication_preference: "whatsapp",
            last_contacted_at: seed.lastContactedAt,
          },
        ],
        { onConflict: "user_id,venue_id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? `Failed to seed customer profile for ${seed.email}.`);
    }

    customerProfiles.set(seed.email, data.id as string);
  }

  const insertSingle = async (table: string, payload: Record<string, unknown>) => {
    const { data, error } = await admin.from(table).insert(payload).select("id").single();
    if (error || !data) {
      throw new Error(error?.message ?? `Failed to insert into ${table}.`);
    }

    return data.id as string;
  };

  const court1Id = await insertSingle("courts", {
    venue_id: venueId,
    name: "Court 01",
    surface: "Outdoor acrylic",
    lighting: true,
    outlook: "East light",
  });
  const court2Id = await insertSingle("courts", {
    venue_id: venueId,
    name: "Court 02",
    surface: "Outdoor acrylic",
    lighting: true,
    outlook: "Main deck",
  });
  const court3Id = await insertSingle("courts", {
    venue_id: venueId,
    name: "Court 03",
    surface: "Outdoor acrylic",
    lighting: true,
    outlook: "Tree line",
  });
  const court4Id = await insertSingle("courts", {
    venue_id: venueId,
    name: "Court 04",
    surface: "Outdoor acrylic",
    lighting: true,
    outlook: "Quiet side",
  });
  const court5Id = await insertSingle("courts", {
    venue_id: venueId,
    name: "Court 05",
    surface: "Outdoor acrylic",
    lighting: false,
    outlook: "Practice edge",
  });

  const sunriseTemplateId = await insertSingle("slot_templates", {
    venue_id: venueId,
    name: "Sunrise Rally",
    duration_minutes: 60,
    confirmation_mode: "instant",
    payment_mode: "online",
    price_inr: 700,
    description: "Fast morning bookings designed to fill before work.",
  });
  const primeTemplateId = await insertSingle("slot_templates", {
    venue_id: venueId,
    name: "Prime-Time Court",
    duration_minutes: 60,
    confirmation_mode: "instant",
    payment_mode: "hybrid",
    price_inr: 900,
    description: "High-demand evening court with member perks and wallet support.",
  });
  const clubTemplateId = await insertSingle("slot_templates", {
    venue_id: venueId,
    name: "Club Hold",
    duration_minutes: 60,
    confirmation_mode: "review",
    payment_mode: "pay_at_venue",
    price_inr: 850,
    description: "Manually reviewed holds for staff-led or high-touch requests.",
  });

  await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: sunriseTemplateId,
    court_id: court1Id,
    starts_at: buildIndiaTimestamp(baseDayOffset, "06:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset, "07:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 700,
    payment_mode: "online",
    confirmation_mode: "instant",
    availability_state: "open",
    label: "Sunrise Rally",
  });
  const slot2Id = await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: sunriseTemplateId,
    court_id: court2Id,
    starts_at: buildIndiaTimestamp(baseDayOffset, "06:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset, "07:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 700,
    payment_mode: "online",
    confirmation_mode: "instant",
    availability_state: "booked",
    label: "Sunrise Rally",
  });
  const slot3Id = await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: primeTemplateId,
    court_id: court3Id,
    starts_at: buildIndiaTimestamp(baseDayOffset, "18:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset, "19:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 900,
    payment_mode: "hybrid",
    confirmation_mode: "instant",
    availability_state: "booked",
    label: "Prime-Time Court",
  });
  const slot4Id = await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: primeTemplateId,
    court_id: court4Id,
    starts_at: buildIndiaTimestamp(baseDayOffset, "19:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset, "20:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 950,
    payment_mode: "hybrid",
    confirmation_mode: "instant",
    availability_state: "booked",
    label: "Golden Hour Court",
  });
  const slot5Id = await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: clubTemplateId,
    court_id: court5Id,
    starts_at: buildIndiaTimestamp(baseDayOffset + 1, "07:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset + 1, "08:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 850,
    payment_mode: "pay_at_venue",
    confirmation_mode: "review",
    availability_state: "booked",
    label: "Coach Hold",
  });
  const slot6Id = await insertSingle("bookable_slots", {
    venue_id: venueId,
    template_id: primeTemplateId,
    court_id: court2Id,
    starts_at: buildIndiaTimestamp(baseDayOffset + 1, "18:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset + 1, "19:00"),
    duration_minutes: 60,
    capacity: 4,
    price_inr: 900,
    payment_mode: "hybrid",
    confirmation_mode: "instant",
    availability_state: "limited",
    label: "Prime-Time Court",
  });

  const weekdayPackId = await insertSingle("pack_products", {
    venue_id: venueId,
    name: "Weekday Starter Pack",
    price_inr: 2400,
    included_credits: 4,
    valid_days: 30,
    description: "A weekday-focused credit pack for sunrise and quiet-hour return visits.",
  });
  const commuterPackId = await insertSingle("pack_products", {
    venue_id: venueId,
    name: "Commuter Flex Pack",
    price_inr: 4600,
    included_credits: 8,
    valid_days: 45,
    description:
      "A higher-balance pack for players who bounce between sunrise and after-work courts.",
  });

  const clubPassId = await insertSingle("membership_plans", {
    venue_id: venueId,
    name: "Club Pass",
    monthly_price_inr: 1800,
    included_credits: 2,
    perks: [
      "Priority booking on prime-time holds",
      "10% lower member rate",
      "Exclusive sunrise offers",
    ],
  });
  const clubPassPlusId = await insertSingle("membership_plans", {
    venue_id: venueId,
    name: "Club Pass Plus",
    monthly_price_inr: 3200,
    included_credits: 4,
    perks: [
      "Prime-time booking priority",
      "Monthly recovery credit",
      "Member-only golden hour drops",
    ],
  });

  const sunriseOfferId = await insertSingle("offers", {
    venue_id: venueId,
    name: "Sunrise Recovery",
    status: "active",
    starts_at: buildIndiaTimestamp(baseDayOffset - 1, "00:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset + 5, "23:00"),
    headline:
      "Bring back off-rhythm regulars with a sunrise credit that feels thoughtful, not discount-first.",
    audience:
      "Targets players who used to visit before work but have gone quiet for 7+ days.",
    redemption_cap: 20,
    slot_scope: "Applies to sunrise inventory only.",
  });
  const memberOfferId = await insertSingle("offers", {
    venue_id: venueId,
    name: "Member Golden Hour",
    status: "active",
    starts_at: buildIndiaTimestamp(baseDayOffset - 1, "00:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset + 10, "23:00"),
    headline:
      "Reward active members with a cleaner path into the venue's best evening inventory.",
    audience:
      "Visible to members and high-retention players already trending toward repeat play.",
    redemption_cap: 12,
    slot_scope: "Applies to prime-time and golden-hour courts.",
  });
  await insertSingle("offers", {
    venue_id: venueId,
    name: "First Pack Top-Up",
    status: "scheduled",
    starts_at: buildIndiaTimestamp(baseDayOffset + 2, "00:00"),
    ends_at: buildIndiaTimestamp(baseDayOffset + 12, "23:00"),
    headline:
      "Convert new players into pack holders without flattening the pricing story for everyone else.",
    audience: "Targets recent first-time players and promo-converted members of the venue.",
    redemption_cap: 15,
    slot_scope: "Applies to any open weekday slot after the second visit.",
  });

  const { error: templateError } = await admin.from("communication_templates").upsert(
    [
      {
        venue_id: venueId,
        slug: "booking-confirmation",
        channel: "whatsapp",
        title: "Booking confirmation",
        body:
          "You are confirmed for {{slot_label}} on {{slot_date}}. Reply if you need to release the court before cutoff.",
      },
      {
        venue_id: venueId,
        slug: "review-approved",
        channel: "whatsapp",
        title: "Review hold approved",
        body: "Your request for {{slot_label}} has been approved. We will hold the court for you.",
      },
      {
        venue_id: venueId,
        slug: "sunrise-recovery",
        channel: "whatsapp",
        title: "Sunrise recovery",
        body: "We dropped a small recovery credit into your wallet for a sunrise session this week.",
      },
      {
        venue_id: venueId,
        slug: "membership-renewal",
        channel: "whatsapp",
        title: "Membership renewal",
        body:
          "Your Sideout membership renews soon. We will keep your member pricing and monthly credits active after renewal.",
      },
    ],
    { onConflict: "venue_id,slug" },
  );

  if (templateError) {
    throw new Error(templateError.message);
  }

  const aravProfileId = customerProfiles.get("arav.demo@sideout.club");
  const meeraProfileId = customerProfiles.get("meera.demo@sideout.club");
  const kabirProfileId = customerProfiles.get("kabir.demo@sideout.club");
  const taraProfileId = customerProfiles.get("tara.demo@sideout.club");

  if (!aravProfileId || !meeraProfileId || !kabirProfileId || !taraProfileId) {
    throw new Error("Failed to resolve seeded customer profiles.");
  }

  const { error: walletError } = await admin.from("wallet_ledger_entries").insert([
    {
      customer_id: ownerProfileId,
      amount_inr: 1800,
      kind: "credit_added",
      note: "Bootstrap owner credit",
    },
    {
      customer_id: ownerProfileId,
      amount_inr: 400,
      kind: "membership_benefit_credit",
      note: "Club Pass launch credit",
    },
    {
      customer_id: aravProfileId,
      amount_inr: 1200,
      kind: "credit_added",
      note: "Prime-time loyalty balance",
    },
    {
      customer_id: meeraProfileId,
      amount_inr: 600,
      kind: "promo_credit",
      note: "Sunset recovery credit",
    },
    {
      customer_id: kabirProfileId,
      amount_inr: 900,
      kind: "membership_benefit_credit",
      note: "Member monthly credit",
    },
    {
      customer_id: taraProfileId,
      amount_inr: 300,
      kind: "promo_credit",
      note: "New player welcome credit",
    },
  ]);

  if (walletError) {
    throw new Error(walletError.message);
  }

  const { error: packOwnershipError } = await admin.from("customer_packs").insert([
    {
      customer_id: ownerProfileId,
      product_id: commuterPackId,
      credits_remaining: 5,
      expires_at: buildIndiaTimestamp(baseDayOffset + 34, "23:00"),
    },
    {
      customer_id: meeraProfileId,
      product_id: weekdayPackId,
      credits_remaining: 2,
      expires_at: buildIndiaTimestamp(baseDayOffset + 5, "23:00"),
    },
  ]);

  if (packOwnershipError) {
    throw new Error(packOwnershipError.message);
  }

  const { error: membershipError } = await admin.from("customer_memberships").upsert(
    [
      {
        customer_id: ownerProfileId,
        plan_id: clubPassId,
        status: "active",
        renews_at: buildIndiaTimestamp(baseDayOffset + 28, "00:00"),
        current_period_ends_at: buildIndiaTimestamp(baseDayOffset + 28, "00:00"),
      },
      {
        customer_id: kabirProfileId,
        plan_id: clubPassPlusId,
        status: "active",
        renews_at: buildIndiaTimestamp(baseDayOffset + 21, "00:00"),
        current_period_ends_at: buildIndiaTimestamp(baseDayOffset + 21, "00:00"),
      },
    ],
    { onConflict: "customer_id,plan_id" },
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const currentBookingId = await insertSingle("bookings", {
    slot_id: slot3Id,
    customer_id: ownerProfileId,
    booked_at: buildIndiaTimestamp(baseDayOffset - 2, "09:30"),
    status: "confirmed",
    payment_status: "credit_applied",
    attendees: 4,
    confirmed_at: buildIndiaTimestamp(baseDayOffset - 2, "09:30"),
  });
  const aravBookingId = await insertSingle("bookings", {
    slot_id: slot4Id,
    customer_id: aravProfileId,
    booked_at: buildIndiaTimestamp(baseDayOffset - 3, "11:00"),
    status: "confirmed",
    payment_status: "paid_online",
    attendees: 4,
    confirmed_at: buildIndiaTimestamp(baseDayOffset - 3, "11:00"),
  });
  await insertSingle("bookings", {
    slot_id: slot2Id,
    customer_id: meeraProfileId,
    booked_at: buildIndiaTimestamp(baseDayOffset - 3, "08:00"),
    status: "requested",
    payment_status: "pending",
    attendees: 2,
  });
  await insertSingle("bookings", {
    slot_id: slot5Id,
    customer_id: taraProfileId,
    booked_at: buildIndiaTimestamp(baseDayOffset - 2, "13:00"),
    status: "requested",
    payment_status: "pay_at_venue",
    attendees: 2,
  });
  const kabirBookingId = await insertSingle("bookings", {
    slot_id: slot6Id,
    customer_id: kabirProfileId,
    booked_at: buildIndiaTimestamp(baseDayOffset - 5, "08:00"),
    status: "completed",
    payment_status: "paid_online",
    attendees: 4,
    completed_at: buildIndiaTimestamp(baseDayOffset - 1, "19:05"),
  });

  const { error: bookingPaymentError } = await admin.from("booking_payments").insert([
    {
      booking_id: currentBookingId,
      amount_inr: 900,
      mode: "wallet",
      status: "credit_applied",
    },
    {
      booking_id: aravBookingId,
      amount_inr: 950,
      mode: "online",
      status: "paid_online",
    },
    {
      booking_id: kabirBookingId,
      amount_inr: 900,
      mode: "online",
      status: "paid_online",
    },
  ]);

  if (bookingPaymentError) {
    throw new Error(bookingPaymentError.message);
  }

  const { error: walletBookingError } = await admin.from("wallet_ledger_entries").insert([
    {
      customer_id: ownerProfileId,
      amount_inr: -900,
      kind: "credit_spent",
      note: "Applied to Prime-Time Court",
    },
  ]);

  if (walletBookingError) {
    throw new Error(walletBookingError.message);
  }

  const { error: attendanceError } = await admin.from("attendance_events").insert([
    {
      booking_id: kabirBookingId,
      customer_id: kabirProfileId,
      attended_at: buildIndiaTimestamp(baseDayOffset - 1, "19:05"),
    },
  ]);

  if (attendanceError) {
    throw new Error(attendanceError.message);
  }

  const { error: noteError } = await admin.from("customer_notes").insert([
    {
      customer_id: meeraProfileId,
      authored_by: "Naina Joshi",
      body:
        "Went quiet after burning through her weekday pack. Best nudge remains a gentle sunset recovery credit.",
    },
    {
      customer_id: taraProfileId,
      authored_by: "Naina Joshi",
      body:
        "Converted from the beginner promo, but still needs a confidence-building second visit.",
    },
    {
      customer_id: aravProfileId,
      authored_by: getAuthUserName(authUser),
      body:
        "High-LTV prime-time regular. Worth protecting with member priority if evenings get tighter.",
    },
  ]);

  if (noteError) {
    throw new Error(noteError.message);
  }

  const { error: redemptionError } = await admin.from("offer_redemptions").insert([
    {
      offer_id: sunriseOfferId,
      customer_id: meeraProfileId,
      redeemed_at: buildIndiaTimestamp(baseDayOffset - 1, "07:00"),
      credit_value_inr: 200,
    },
    {
      offer_id: memberOfferId,
      customer_id: kabirProfileId,
      redeemed_at: buildIndiaTimestamp(baseDayOffset - 2, "19:00"),
      credit_value_inr: 250,
    },
  ]);

  if (redemptionError) {
    throw new Error(redemptionError.message);
  }

  const { data: templateRows, error: templateLookupError } = await admin
    .from("communication_templates")
    .select("id,slug")
    .eq("venue_id", venueId);

  if (templateLookupError) {
    throw new Error(templateLookupError.message);
  }

  const bookingConfirmationTemplateId = templateRows?.find(
    (template) => template.slug === "booking-confirmation",
  )?.id;
  const sunriseRecoveryTemplateId = templateRows?.find(
    (template) => template.slug === "sunrise-recovery",
  )?.id;

  const { error: communicationError } = await admin.from("communication_deliveries").insert([
    {
      venue_id: venueId,
      customer_id: ownerProfileId,
      booking_id: currentBookingId,
      template_id: bookingConfirmationTemplateId ?? null,
      status: "delivered",
      provider: "twilio_whatsapp",
      provider_message_id: "demo-msg-001",
      body: "You are confirmed for Prime-Time Court tomorrow.",
      sent_at: buildIndiaTimestamp(baseDayOffset - 2, "09:31"),
    },
    {
      venue_id: venueId,
      customer_id: meeraProfileId,
      template_id: sunriseRecoveryTemplateId ?? null,
      status: "sent",
      provider: "twilio_whatsapp",
      provider_message_id: "demo-msg-002",
      body: "We dropped a sunrise recovery credit into your wallet.",
      sent_at: buildIndiaTimestamp(baseDayOffset - 1, "09:10"),
    },
  ]);

  if (communicationError) {
    throw new Error(communicationError.message);
  }

  const { error: activityError } = await admin.from("operator_activity_log").insert([
    {
      venue_id: venueId,
      actor_user_id: ownerUserId,
      customer_id: ownerProfileId,
      booking_id: currentBookingId,
      action: "booking_approved",
      detail: "Prime-Time Court confirmed from the operator queue.",
      created_at: buildIndiaTimestamp(baseDayOffset - 2, "09:32"),
    },
    {
      venue_id: venueId,
      actor_user_id: ownerUserId,
      customer_id: meeraProfileId,
      action: "credit_added",
      detail: "Sunset recovery credit added for a lapsed pack holder.",
      created_at: buildIndiaTimestamp(baseDayOffset - 1, "09:12"),
    },
    {
      venue_id: venueId,
      actor_user_id: ownerUserId,
      customer_id: meeraProfileId,
      action: "whatsapp_sent",
      detail: "We dropped a sunrise recovery credit into your wallet.",
      created_at: buildIndiaTimestamp(baseDayOffset - 1, "09:13"),
    },
  ]);

  if (activityError) {
    throw new Error(activityError.message);
  }

  return {
    message: "Live Sideout venue initialized. Customer and admin routes are now backed by seeded Supabase data.",
    venueId,
    created: true,
  };
}
