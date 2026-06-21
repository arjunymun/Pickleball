"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, TriangleAlert } from "lucide-react";

// Status the confirmation page resolves to after polling the server record.
type ConfirmationState = "pending" | "confirmed" | "timeout";

// Minimal shape of the relevant part of GET /api/bookings/me. Kept local so the page
// does not couple to the full runtime snapshot type.
interface BookingsMeResponse {
  upcoming?: Array<{ booking?: { id?: string; status?: string } }>;
  history?: Array<{ id?: string; status?: string }>;
}

const CONFIRMED_STATUSES = new Set(["confirmed", "checked_in", "completed"]);
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 30000;

export function BookingStatus({ bookingId }: { bookingId: string | null }) {
  const [state, setState] = useState<ConfirmationState>(bookingId ? "pending" : "timeout");
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!bookingId) {
      return;
    }

    let isActive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Set the polling window start inside the effect so render stays pure.
    startedAtRef.current = Date.now();

    async function poll() {
      if (!isActive) {
        return;
      }

      try {
        const response = await fetch("/api/bookings/me", { cache: "no-store" });
        if (response.ok) {
          const payload = (await response.json()) as BookingsMeResponse;
          const match =
            payload.upcoming?.find((entry) => entry.booking?.id === bookingId)?.booking ??
            payload.history?.find((entry) => entry.id === bookingId);

          if (match?.status && CONFIRMED_STATUSES.has(match.status)) {
            if (isActive) {
              setState("confirmed");
            }
            return;
          }
        }
      } catch {
        // Network hiccup — keep polling until the timeout window closes.
      }

      if (!isActive) {
        return;
      }

      if (Date.now() - (startedAtRef.current ?? Date.now()) >= POLL_TIMEOUT_MS) {
        setState("timeout");
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    void poll();

    return () => {
      isActive = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [bookingId]);

  if (state === "confirmed") {
    return (
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--line-soft)] bg-[rgba(31,106,84,0.08)] p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--accent-green)]" />
        <div>
          <p className="font-medium text-[var(--ink-strong)]">Booking confirmed</p>
          <p className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">
            Stripe confirmed the payment and the webhook marked your court as booked.
          </p>
        </div>
      </div>
    );
  }

  if (state === "timeout") {
    return (
      <div className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
        <TriangleAlert className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
        <div>
          <p className="font-medium text-[var(--ink-strong)]">Still syncing</p>
          <p className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">
            This is taking longer than usual. Please{" "}
            <a href="/app/bookings" className="font-semibold text-[var(--accent-deep)] underline">
              check your bookings
            </a>{" "}
            in a moment — the webhook may still be processing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-[1.4rem] border border-[var(--line-soft)] bg-white/70 p-5">
      <Clock3 className="mt-0.5 h-5 w-5 animate-pulse text-[var(--accent)]" />
      <div>
        <p className="font-medium text-[var(--ink-strong)]">Confirming your booking…</p>
        <p className="mt-1 text-sm leading-7 text-[var(--ink-soft)]">
          Waiting for the verified Stripe webhook to mark this booking as paid. This page updates
          automatically.
        </p>
      </div>
    </div>
  );
}
