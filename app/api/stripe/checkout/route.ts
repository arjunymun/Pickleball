import { NextResponse } from "next/server";

import { getSiteUrl } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStripeServerClient } from "@/lib/stripe/server";

async function getOrCreateStripeCustomer(params: {
  stripeCustomerId: string | null;
  email: string;
  name: string;
  phone: string | null;
}) {
  const stripe = getStripeServerClient();
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  if (params.stripeCustomerId) {
    return params.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    phone: params.phone ?? undefined,
  });

  return customer.id;
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client unavailable." }, { status: 503 });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    kind?: "pack" | "membership";
    resourceId?: string;
  };

  if (!body.kind || !body.resourceId) {
    return NextResponse.json({ error: "kind and resourceId are required." }, { status: 400 });
  }

  const { data: appUserRow } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!appUserRow) {
    return NextResponse.json({ error: "App user not provisioned yet." }, { status: 404 });
  }

  const { data: customerProfileRow } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("user_id", appUserRow.id)
    .limit(1)
    .maybeSingle();

  if (!customerProfileRow) {
    return NextResponse.json({ error: "Customer profile not found." }, { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const adminSupabase = createSupabaseAdminClient();
  const stripeCustomerId = await getOrCreateStripeCustomer({
    stripeCustomerId: typeof appUserRow.stripe_customer_id === "string" ? appUserRow.stripe_customer_id : null,
    email: String(appUserRow.email),
    name: String(appUserRow.full_name),
    phone: typeof appUserRow.phone === "string" ? appUserRow.phone : null,
  });

  if (adminSupabase && stripeCustomerId !== appUserRow.stripe_customer_id) {
    await adminSupabase.from("users").update({ stripe_customer_id: stripeCustomerId }).eq("id", appUserRow.id);
  }

  if (body.kind === "pack") {
    const { data: packProductRow } = await supabase
      .from("pack_products")
      .select("*")
      .eq("id", body.resourceId)
      .maybeSingle();

    if (!packProductRow) {
      return NextResponse.json({ error: "Pack product not found." }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      success_url: `${siteUrl}/app/wallet?checkout=success`,
      cancel_url: `${siteUrl}/app/offers?checkout=canceled`,
      metadata: {
        kind: "pack",
        packProductId: String(packProductRow.id),
        customerProfileId: String(customerProfileRow.id),
      },
      line_items: [
        packProductRow.stripe_price_id
          ? {
              price: String(packProductRow.stripe_price_id),
              quantity: 1,
            }
          : {
              price_data: {
                currency: "inr",
                product_data: {
                  name: String(packProductRow.name),
                  description: String(packProductRow.description),
                },
                unit_amount: Number(packProductRow.price_inr) * 100,
              },
              quantity: 1,
            },
      ],
    });

    return NextResponse.json({ url: session.url });
  }

  const { data: membershipPlanRow } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("id", body.resourceId)
    .maybeSingle();

  if (!membershipPlanRow) {
    return NextResponse.json({ error: "Membership plan not found." }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    success_url: `${siteUrl}/app/offers?checkout=success`,
    cancel_url: `${siteUrl}/app/offers?checkout=canceled`,
    metadata: {
      kind: "membership",
      membershipPlanId: String(membershipPlanRow.id),
      customerProfileId: String(customerProfileRow.id),
    },
    line_items: [
      membershipPlanRow.stripe_price_id
        ? {
            price: String(membershipPlanRow.stripe_price_id),
            quantity: 1,
          }
        : {
            price_data: {
              currency: "inr",
              product_data: {
                name: String(membershipPlanRow.name),
              },
              recurring: {
                interval: "month",
              },
              unit_amount: Number(membershipPlanRow.monthly_price_inr) * 100,
            },
            quantity: 1,
          },
    ],
  });

  return NextResponse.json({ url: session.url });
}
