import { NextResponse } from "next/server";

import { sendWhatsappMessage } from "@/lib/communications/whatsapp";
import { getSupabaseRuntimeSnapshot } from "@/lib/runtime-backend";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server client unavailable." }, { status: 503 });
  }

  const body = (await request.json()) as {
    customerId?: string;
    templateId?: string;
    body?: string;
  };

  if (!body.customerId || !body.templateId || !body.body) {
    return NextResponse.json({ error: "customerId, templateId, and body are required." }, { status: 400 });
  }

  const { data: customerProfile } = await supabase
    .from("customer_profiles")
    .select("id, phone_e164")
    .eq("id", body.customerId)
    .maybeSingle();

  if (!customerProfile) {
    return NextResponse.json({ error: "Customer profile not found." }, { status: 404 });
  }

  if (!customerProfile.phone_e164) {
    return NextResponse.json({ error: "Customer phone number is missing for WhatsApp delivery." }, { status: 400 });
  }

  const templateSlug = body.templateId.startsWith("template-")
    ? body.templateId.replace(/^template-/, "")
    : body.templateId;

  const delivery = await sendWhatsappMessage({
    to: customerProfile.phone_e164,
    body: body.body,
  });

  const { data, error } = await supabase.rpc("log_communication_delivery_as_admin", {
    customer_uuid: body.customerId,
    template_slug: templateSlug,
    message_body: body.body,
    delivery_status: delivery.status,
    provider_name: delivery.provider,
    provider_message: delivery.providerMessageId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const snapshot = await getSupabaseRuntimeSnapshot();

  return NextResponse.json({
    message: typeof data === "string" ? data : "Communication delivery logged.",
    snapshot,
  });
}
