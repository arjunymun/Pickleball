"use client";

import type { ApiErrorPayload } from "@/lib/academy/contracts";

export class AcademyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AcademyApiError";
  }
}

export async function academyFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;
  try {
    const response = await fetch(path, {
      ...init,
      cache: "no-store",
      signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = payload as Partial<ApiErrorPayload> | null;
      throw new AcademyApiError(
        error?.error ?? "We couldn't complete that request. Please try again.",
        response.status,
        error?.code,
      );
    }
    if (payload === null)
      throw new AcademyApiError(
        "The server returned an unreadable response.",
        502,
      );
    return payload as T;
  } catch (error) {
    if (error instanceof AcademyApiError) throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new AcademyApiError(
        "The request took too long. Please try again.",
        503,
      );
    throw new AcademyApiError(
      "Unable to connect. Check your connection and try again.",
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function academyPost<T>(path: string, body: unknown): Promise<T> {
  return academyFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
