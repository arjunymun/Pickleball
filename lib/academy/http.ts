import { NextResponse } from "next/server";
import { z } from "zod";
import { AcademyError } from "@/lib/academy/errors";

export function academyJson(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
}
export async function academyRoute(action: () => Promise<unknown>) {
  try {
    return academyJson(await action());
  } catch (error) {
    if (error instanceof AcademyError)
      return academyJson(
        { error: error.message, code: error.code },
        error.status,
      );
    console.error("academy request failed", { code: "UNEXPECTED_ERROR" });
    return academyJson(
      {
        error:
          "The academy service is temporarily unavailable. Please try again later.",
        code: "BACKEND_UNAVAILABLE",
      },
      503,
    );
  }
}

export function requireSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (
    (origin &&
      origin !== new URL(request.url).origin &&
      (!site || origin !== new URL(site).origin)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AcademyError(
      "This request must come from the academy website.",
      403,
      "INVALID_ORIGIN",
    );
}
export async function academyBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  requireSameOrigin(request);
  if ((Number(request.headers.get("content-length")) || 0) > 16384)
    throw new AcademyError("Request is too large.", 413, "INVALID_REQUEST");
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 16384) throw new Error("Oversized request");
    body = JSON.parse(raw);
  } catch {
    throw new AcademyError("Request must contain valid JSON.");
  }
  const result = schema.safeParse(body);
  if (!result.success)
    throw new AcademyError("Check the submitted details and try again.");
  return result.data;
}
export function retiredRoute() {
  return academyJson(
    {
      error:
        "This legacy endpoint has been retired. Use the academy booking service.",
      code: "LEGACY_ENDPOINT_RETIRED",
    },
    410,
  );
}
