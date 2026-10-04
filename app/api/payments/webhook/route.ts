import { AcademyError } from "@/lib/academy/errors";
import { academyRoute } from "@/lib/academy/http";
import { academyPayments } from "@/lib/academy/server";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  return academyRoute(async () => {
    const raw = await request.text();
    if (raw.length > 262144)
      throw new AcademyError("Webhook payload is too large.", 413);
    return academyPayments().webhook(
      raw,
      request.headers.get("x-razorpay-signature") ?? "",
      request.headers.get("x-razorpay-event-id") ?? "",
    );
  });
}
