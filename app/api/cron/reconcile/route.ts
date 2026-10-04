import { timingSafeEqual } from "node:crypto";
import { AcademyError } from "@/lib/academy/errors";
import { academyRoute } from "@/lib/academy/http";
import { academyPayments } from "@/lib/academy/server";
import { academyRepository } from "@/lib/academy/repository";
import { paymentMode } from "@/lib/academy/gateway";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(request: Request) {
  return academyRoute(async () => {
    const secret = process.env.CRON_SECRET;
    const received = request.headers.get("authorization") ?? "";
    const expected = secret ? "Bearer " + secret : "";
    if (
      !secret ||
      received.length !== expected.length ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    )
      throw new AcademyError(
        "Scheduler authentication required.",
        401,
        "AUTH_REQUIRED",
      );
    await academyRepository().dispatch("expire");
    return paymentMode() === "unconfigured"
      ? { expired: true, paymentsConfigured: false }
      : academyPayments().reconcile();
  });
}
