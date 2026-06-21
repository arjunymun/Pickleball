"use client";

import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import type { VenueSettings } from "@/lib/domain";
import {
  addCustomerNote as applyAddCustomerNote,
  addWalletCredit as applyWalletCredit,
  approveBooking as applyApproveBooking,
  bookSlot as applyBookSlot,
  type BookSlotOptions,
  cancelBooking as applyCancelBooking,
  checkInBooking as applyCheckInBooking,
  completeBooking as applyCompleteBooking,
  confirmBookingCheckout as applyConfirmCheckout,
  createSeedDemoState,
  DEMO_STATE_VERSION,
  getCommercialCatalog,
  getAdminDashboard,
  getCustomerExperience,
  markBookingNoShow as applyMarkBookingNoShow,
  sendCommunication as applySendCommunication,
  updateVenueSettings as applyUpdateVenueSettings,
  type DemoState,
} from "@/lib/demo-state";
import { PREVIEW_CUSTOMER_ID } from "@/lib/mock-data";
import type { RuntimeMutationResponse, RuntimeSnapshot } from "@/lib/runtime-types";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const STORAGE_KEY = "sideout-demo-state-v1";
const SERVER_SNAPSHOT = createSeedDemoState();

let currentState: DemoState = SERVER_SNAPSHOT;
let hasHydrated = false;
let storageListenerAttached = false;

const listeners = new Set<() => void>();

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DemoState>;

  return (
    candidate.version === DEMO_STATE_VERSION &&
    Array.isArray(candidate.bookings) &&
    Array.isArray(candidate.walletLedgerEntries) &&
    Array.isArray(candidate.customerNotes) &&
    Array.isArray(candidate.operatorActivity) &&
    Array.isArray(candidate.communicationDeliveries) &&
    Array.isArray(candidate.offerRedemptions) &&
    Boolean(candidate.venueSettings)
  );
}

function readStateFromStorage() {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return createSeedDemoState();
    }

    const parsedValue = JSON.parse(storedValue) as unknown;
    return isDemoState(parsedValue) ? parsedValue : createSeedDemoState();
  } catch {
    return createSeedDemoState();
  }
}

function persistState(state: DemoState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notifySubscribers() {
  listeners.forEach((listener) => listener());
}

function attachStorageListener() {
  if (typeof window === "undefined" || storageListenerAttached) {
    return;
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    currentState = readStateFromStorage();
    notifySubscribers();
  });

  storageListenerAttached = true;
}

function ensureHydrated() {
  if (typeof window === "undefined" || hasHydrated) {
    return;
  }

  currentState = readStateFromStorage();
  hasHydrated = true;
  attachStorageListener();
}

function setCurrentState(nextState: DemoState) {
  currentState = nextState;
  persistState(nextState);
  notifySubscribers();
}

function runMutation(mutate: (state: DemoState) => { nextState: DemoState; message: string }) {
  ensureHydrated();

  const result = mutate(currentState);
  setCurrentState(result.nextState);

  return result.message;
}

function subscribe(listener: () => void) {
  ensureHydrated();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureHydrated();
  return currentState;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function createDemoRuntimeSnapshot(state: DemoState, customerId = PREVIEW_CUSTOMER_ID): RuntimeSnapshot {
  const adminDashboard = getAdminDashboard(state);
  const customerExperience = getCustomerExperience(state, customerId);
  const catalog = getCommercialCatalog();

  return {
    source: "demo",
    auth: {
      status: "signed_out",
      viewer: {
        fullName: null,
        email: null,
        phone: null,
        primaryRole: "guest",
      },
    },
    setup: {
      status: "demo",
      venueId: adminDashboard.venue.id,
      canBootstrapVenue: false,
    },
    publicSite: {
      venue: adminDashboard.venue,
      venueSettings: null,
      featuredSlots: customerExperience.slots.slice(0, 4).map((entry) => entry.slot),
      featuredOffers: catalog.offers.filter((offer) => offer.status !== "expired").slice(0, 3),
      metrics: {
        courtCount: adminDashboard.courts.length,
        repeatPlayRate: adminDashboard.metrics.repeatPlayRate,
        offersRedeemed: adminDashboard.metrics.offersRedeemed,
        creditsExpiringSoon: adminDashboard.metrics.creditsExpiringSoon,
      },
    },
    venueSettings: null,
    customerExperience,
    adminDashboard,
    catalog,
    capabilities: {
      customerLive: false,
      adminLive: false,
      commerceLive: false,
      messagingLive: false,
      pwaReady: true,
    },
  };
}

function createLiveRequiredSnapshot(demoSnapshot: RuntimeSnapshot): RuntimeSnapshot {
  return {
    ...demoSnapshot,
    source: "supabase",
    auth: {
      status: "signed_out",
      viewer: {
        fullName: null,
        email: null,
        phone: null,
        primaryRole: "guest",
      },
    },
    setup: {
      status: "needs_bootstrap",
      venueId: null,
      canBootstrapVenue: false,
    },
    customerExperience: {
      ...demoSnapshot.customerExperience,
      user: {
        id: "live-user-required",
        name: "Live customer",
        email: "sign-in-required@sideout.local",
        phone: "",
      },
      walletBalance: 0,
      walletEntries: [],
      pack: null,
      packSnapshot: null,
      membership: null,
      membershipSnapshot: null,
      upcomingBookings: [],
      slots: [],
    },
    adminDashboard: {
      ...demoSnapshot.adminDashboard,
      schedule: [],
      requestQueue: [],
      upcomingConfirmed: [],
      atRiskCustomers: [],
      customers: [],
      operatorActivity: [],
      communicationDeliveries: [],
      metrics: {
        repeatPlayRate: 0,
        occupancyRate: 0,
        creditsExpiringSoon: 0,
        offersRedeemed: 0,
      },
      customerSegments: {
        inactivePlayers: 0,
        expiringPackValue: 0,
        upcomingRenewals: 0,
        noShowRisk: 0,
      },
    },
    capabilities: {
      customerLive: false,
      adminLive: false,
      commerceLive: false,
      messagingLive: false,
      pwaReady: true,
    },
  };
}

async function readJsonSafely<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchRuntimeSnapshot() {
  const response = await fetch("/api/runtime", {
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await readJsonSafely<{ error?: string }>(response);
    throw new Error(payload?.error ?? "Sideout could not load the runtime snapshot.");
  }

  const payload = await readJsonSafely<RuntimeSnapshot>(response);
  if (!payload) {
    throw new Error("Sideout returned an empty runtime snapshot.");
  }

  return payload;
}

async function postRuntimeMutation(path: string, body?: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = await readJsonSafely<{ error?: string }>(response);
    throw new Error(payload?.error ?? "Sideout could not complete that live action.");
  }

  const payload = await readJsonSafely<RuntimeMutationResponse>(response);
  if (!payload) {
    throw new Error("Sideout returned an empty mutation response.");
  }

  return payload;
}

export function resetDemoState() {
  const nextState = createSeedDemoState();
  hasHydrated = true;
  setCurrentState(nextState);

  return "Demo state reset. Customer and operator views are back to the seeded Sideout scenario.";
}

export function useSideoutDemo(customerId = PREVIEW_CUSTOMER_ID) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const demoSnapshot = useMemo(() => createDemoRuntimeSnapshot(state, customerId), [customerId, state]);
  const [runtimeSnapshot, setRuntimeSnapshot] = useState<RuntimeSnapshot | null>(null);
  // Must be derived from usePathname (not window.location): window is undefined during the
  // static prerender, so a window-based check renders false on the server. With NEXT_PUBLIC
  // Supabase env present on Vercel, that pushed /demo into the live-required empty branch
  // ("No slot / 0 court windows") and caused a hydration mismatch. usePathname resolves
  // correctly during SSR and on the client, so the demo prerenders its real seed.
  const pathname = usePathname();
  const isDemoRoute = pathname?.startsWith("/demo") ?? false;
  const [authStatus, setAuthStatus] = useState<"loading" | "signed_in" | "signed_out">(
    Boolean(getSupabasePublicEnv()) ? "loading" : "signed_out",
  );
  const hasSupabaseEnv = useMemo(() => Boolean(getSupabasePublicEnv()), []);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    let isActive = true;

    async function syncRuntimeSnapshot(nextStatus?: "signed_in" | "signed_out") {
      if (nextStatus === "signed_out") {
        if (isActive) {
          setRuntimeSnapshot(null);
        }
        return;
      }

      try {
        const nextSnapshot = await fetchRuntimeSnapshot();
        if (isActive) {
          setRuntimeSnapshot(nextSnapshot);
        }
      } catch {
        if (isActive) {
          setRuntimeSnapshot(null);
        }
      }
    }

    void supabase.auth.getUser().then((result: { data: { user: SupabaseUser | null } }) => {
      const user = result.data.user;

      if (!isActive) {
        return;
      }

      const nextStatus = user ? "signed_in" : "signed_out";
      setAuthStatus(nextStatus);
      void syncRuntimeSnapshot(nextStatus);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: SupabaseSession | null) => {
      const nextStatus = session?.user ? "signed_in" : "signed_out";

      if (isActive) {
        setAuthStatus(nextStatus);
      }

      void syncRuntimeSnapshot(nextStatus);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [hasSupabaseEnv]);

  // When Supabase is configured but no live snapshot has loaded (signed-out or not yet
  // bootstrapped), show the genuine live-required state. When Supabase is NOT configured at
  // all (e.g. the public Vercel deploy), fall back to the functional local demo runtime so
  // visitors can actually browse availability and book instead of hitting a dead empty feed.
  const activeSnapshot =
    runtimeSnapshot?.source === "supabase"
      ? runtimeSnapshot
      : isDemoRoute
        ? demoSnapshot
        : hasSupabaseEnv
          ? createLiveRequiredSnapshot(demoSnapshot)
          : demoSnapshot;
  const customerExperience = activeSnapshot.customerExperience;
  const adminDashboard = activeSnapshot.adminDashboard;
  const catalog = activeSnapshot.catalog;

  async function bookSlot(slotId: string, options: BookSlotOptions = {}) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.customerLive) {
        throw new Error("This signed-in account does not have a live customer profile ready yet.");
      }

      const payload = await postRuntimeMutation("/api/bookings/holds", {
        slotId,
        // Forwarded so the live offer-redemption path (txcore) can read the same contract.
        ...(options.offerId ? { offerId: options.offerId } : {}),
      });
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute && hasSupabaseEnv) {
      throw new Error("Demo bookings live on /demo. Sign in and initialize live mode to book from the main product.");
    }

    return runMutation((draft) => applyBookSlot(draft, slotId, customerId, options));
  }

  async function startBookingCheckout(bookingId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.customerLive) {
        throw new Error("This signed-in account does not have a live customer profile ready yet.");
      }

      const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
        method: "POST",
      });

      const payload = await readJsonSafely<{ error?: string; url?: string }>(response);
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Sideout could not start booking checkout.");
      }

      window.location.assign(payload.url);
      return "Redirecting to Stripe Checkout.";
    }

    if (!isDemoRoute && hasSupabaseEnv) {
      throw new Error("Checkout is live-only. Use /demo for the narrated booking walkthrough.");
    }

    // In the recruiter demo there is no real Stripe redirect; advancing the booking locally lets the
    // hold -> checkout -> confirmed lifecycle play out so the webhook story is demonstrable.
    return runMutation((draft) => applyConfirmCheckout(draft, bookingId));
  }

  async function cancelBooking(bookingId: string, actorLabel = "Customer") {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.customerLive) {
        throw new Error("This signed-in account cannot cancel customer bookings yet.");
      }

      const payload = await postRuntimeMutation(`/api/runtime/bookings/${bookingId}/cancel`);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute && hasSupabaseEnv) {
      throw new Error("Demo cancellations live on /demo. Sign in to manage real bookings from the main product.");
    }

    return runMutation((draft) => applyCancelBooking(draft, bookingId, actorLabel));
  }

  async function approveBooking(bookingId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live approvals.");
      }

      const payload = await postRuntimeMutation(`/api/runtime/admin/bookings/${bookingId}/approve`);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo approvals live on /demo. Sign in as an operator to manage real bookings.");
    }

    return runMutation((draft) => applyApproveBooking(draft, bookingId));
  }

  async function addWalletCredit(targetCustomerId: string, amountInr: number, note: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live credit actions.");
      }

      const payload = await postRuntimeMutation("/api/runtime/admin/wallet-credit", {
        customerId: targetCustomerId,
        amountInr,
        note,
      });
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo wallet actions live on /demo. Sign in as an operator to manage real credits.");
    }

    return runMutation((draft) => applyWalletCredit(draft, targetCustomerId, amountInr, note));
  }

  async function checkInBooking(bookingId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live check-ins.");
      }

      const payload = await postRuntimeMutation(`/api/runtime/admin/bookings/${bookingId}/check-in`);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo check-ins live on /demo. Sign in as an operator to manage real bookings.");
    }

    return runMutation((draft) => applyCheckInBooking(draft, bookingId));
  }

  async function completeBooking(bookingId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live completion actions.");
      }

      const payload = await postRuntimeMutation(`/api/runtime/admin/bookings/${bookingId}/complete`);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo completion actions live on /demo. Sign in as an operator to manage real bookings.");
    }

    return runMutation((draft) => applyCompleteBooking(draft, bookingId));
  }

  async function markBookingNoShow(bookingId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live no-show actions.");
      }

      const payload = await postRuntimeMutation(`/api/runtime/admin/bookings/${bookingId}/no-show`);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo no-show actions live on /demo. Sign in as an operator to manage real bookings.");
    }

    return runMutation((draft) => applyMarkBookingNoShow(draft, bookingId));
  }

  async function addCustomerNote(customerId: string, body: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for customer notes.");
      }

      const payload = await postRuntimeMutation("/api/runtime/admin/customer-note", {
        customerId,
        body,
      });
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo notes live on /demo. Sign in as an operator to manage real customer notes.");
    }

    return runMutation((draft) => applyAddCustomerNote(draft, customerId, body));
  }

  async function updateVenueSettings(patch: Record<string, unknown>) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for venue settings.");
      }

      const payload = await postRuntimeMutation("/api/runtime/admin/venue-settings", patch);
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo settings live on /demo. Sign in as an operator to manage real venue settings.");
    }

    return runMutation((draft) => applyUpdateVenueSettings(draft, patch as Partial<VenueSettings>));
  }

  async function sendCommunication(customerId: string, templateId: string, body: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.adminLive) {
        throw new Error("This signed-in account does not have admin access for live messaging.");
      }

      const payload = await postRuntimeMutation("/api/runtime/admin/send-message", {
        customerId,
        templateId,
        body,
      });
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    if (!isDemoRoute) {
      throw new Error("Demo messages live on /demo. Sign in as an operator to manage real messaging.");
    }

    return runMutation((draft) => applySendCommunication(draft, customerId, templateId, body));
  }

  async function bootstrapVenue() {
    if (!hasSupabaseEnv) {
      throw new Error("Supabase environment variables are missing. Add them in .env.local first.");
    }

    if (authStatus !== "signed_in") {
      throw new Error("Sign in with Supabase before initializing a live Sideout venue.");
    }

    const payload = await postRuntimeMutation("/api/runtime/bootstrap");
    setRuntimeSnapshot(payload.snapshot);
    return payload.message;
  }

  async function reset() {
    if (activeSnapshot.source === "supabase" || !isDemoRoute) {
      return "Demo reset is only available inside the recruiter demo at /demo.";
    }

    return resetDemoState();
  }

  // Demo actions only mutate state when the user is actually on a /demo/* route. On the
  // production /admin/* and /app routes without Supabase, the same demo runtime backs the UI
  // but the mutations throw — so surfaces use this to render a read-only state instead of
  // letting a recruiter click buttons that error.
  const isReadOnlyDemo = activeSnapshot.source !== "supabase" && !isDemoRoute;

  return {
    runtimeSource: activeSnapshot.source,
    isDemoRoute,
    isReadOnlyDemo,
    auth: activeSnapshot.auth,
    setup: activeSnapshot.setup,
    publicSite: activeSnapshot.publicSite,
    venueSettings: activeSnapshot.venueSettings,
    isSupabaseConfigured: hasSupabaseEnv,
    authStatus,
    customerExperience,
    adminDashboard,
    catalog,
    capabilities: activeSnapshot.capabilities,
    bookSlot,
    startBookingCheckout,
    cancelBooking,
    approveBooking,
    addWalletCredit,
    checkInBooking,
    completeBooking,
    markBookingNoShow,
    addCustomerNote,
    updateVenueSettings,
    sendCommunication,
    bootstrapVenue,
    resetDemoState: reset,
  };
}
