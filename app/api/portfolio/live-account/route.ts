import { NextResponse } from "next/server";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bootstrapLiveVenueForAuthUser } from "@/lib/supabase/bootstrap-live";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { portfolioAccountSchema, readJsonBody } from "@/lib/validation";

const CUSTOMER_EMAIL = "portfolio.player@sideout.club";
const OPERATOR_EMAIL = "portfolio.operator@sideout.club";
const PORTFOLIO_PASSWORD = "Sideout-May-2026!";

function isPortfolioLoginEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_PORTFOLIO_ACCOUNTS === "true";
}

function formatPortfolioError(error: unknown) {
  const message = error instanceof Error ? error.message : "Could not prepare the portfolio live account.";

  if (message === "fetch failed" || message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
    const env = getSupabasePublicEnv();
    const configuredUrl = env?.url ? ` Current URL: ${env.url}.` : "";
    return `Supabase is unreachable from this app.${configuredUrl} Update .env.local with an active Supabase project URL and keys, then restart the dev server.`;
  }

  return message;
}

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    throw new Error(error.message);
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureAuthUser(options: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const existingUser = await findAuthUserByEmail(options.email);
  if (existingUser) {
    const { data, error } = await admin.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password: PORTFOLIO_PASSWORD,
      user_metadata: {
        full_name: options.fullName,
        phone: options.phone,
      },
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Could not update the portfolio auth user.");
    }

    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: options.email,
    password: PORTFOLIO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
      phone: options.phone,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Could not create the portfolio auth user.");
  }

  return data.user;
}

async function ensureVenue(ownerAuthUser: SupabaseAuthUser) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data: venue } = await admin.from("venues").select("id").order("name").limit(1).maybeSingle();
  if (venue?.id) {
    return String(venue.id);
  }

  const bootstrapped = await bootstrapLiveVenueForAuthUser(ownerAuthUser);
  return bootstrapped.venueId;
}

async function ensureAppUser(options: {
  authUser: SupabaseAuthUser;
  fullName: string;
  email: string;
  phone: string;
}) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const { data, error } = await admin
    .from("users")
    .upsert(
      {
        auth_user_id: options.authUser.id,
        full_name: options.fullName,
        email: options.email,
        phone: options.phone,
      },
      { onConflict: "email" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not upsert portfolio app user.");
  }

  return String(data.id);
}

async function ensurePortfolioCustomer() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const ownerAuthUser = await ensureAuthUser({
    email: OPERATOR_EMAIL,
    fullName: "Sideout Portfolio Operator",
    phone: "+919876543150",
  });
  const venueId = await ensureVenue(ownerAuthUser);
  const customerAuthUser = await ensureAuthUser({
    email: CUSTOMER_EMAIL,
    fullName: "Rhea Portfolio",
    phone: "+919876543151",
  });
  const appUserId = await ensureAppUser({
    authUser: customerAuthUser,
    fullName: "Rhea Portfolio",
    email: CUSTOMER_EMAIL,
    phone: "+91 98765 43151",
  });

  await admin.from("customer_profiles").upsert(
    {
      user_id: appUserId,
      venue_id: venueId,
      favorite_window: "Sunrise",
      skill_band: "3.5 to 4.0",
      tags: ["portfolio", "member", "booking-ready"],
      phone_e164: "+919876543151",
      whatsapp_opt_in: true,
      communication_preference: "whatsapp",
    },
    { onConflict: "user_id,venue_id" },
  );
}

async function ensurePortfolioOperator() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    throw new Error("Supabase service role is not configured.");
  }

  const operatorAuthUser = await ensureAuthUser({
    email: OPERATOR_EMAIL,
    fullName: "Sideout Portfolio Operator",
    phone: "+919876543150",
  });
  const venueId = await ensureVenue(operatorAuthUser);
  const appUserId = await ensureAppUser({
    authUser: operatorAuthUser,
    fullName: "Sideout Portfolio Operator",
    email: OPERATOR_EMAIL,
    phone: "+91 98765 43150",
  });

  await admin.from("admin_roles").upsert(
    {
      user_id: appUserId,
      venue_id: venueId,
      kind: "owner",
    },
    { onConflict: "user_id,venue_id" },
  );
}

export async function POST(request: Request) {
  if (!isPortfolioLoginEnabled()) {
    return NextResponse.json(
      { error: "Portfolio live accounts are disabled in this environment." },
      { status: 403 },
    );
  }

  try {
    const parsed = await readJsonBody(request, portfolioAccountSchema);
    if (parsed.error) {
      return parsed.error;
    }
    const role = parsed.data.role === "operator" ? "operator" : "customer";

    if (role === "operator") {
      await ensurePortfolioOperator();
    } else {
      await ensurePortfolioCustomer();
    }

    return NextResponse.json({
      email: role === "operator" ? OPERATOR_EMAIL : CUSTOMER_EMAIL,
      password: PORTFOLIO_PASSWORD,
      redirectTo: role === "operator" ? "/admin" : "/app/bookings",
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatPortfolioError(error) },
      { status: 500 },
    );
  }
}
