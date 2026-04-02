"use client";

import type { Session as SupabaseSession, User as SupabaseUser } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  addWalletCredit as applyWalletCredit,
  approveBooking as applyApproveBooking,
  bookSlot as applyBookSlot,
  cancelBooking as applyCancelBooking,
  createSeedDemoState,
  DEMO_STATE_VERSION,
  getCommercialCatalog,
  getAdminDashboard,
  getCustomerExperience,
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
    Array.isArray(candidate.customerNotes)
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
  return {
    source: "demo",
    customerExperience: getCustomerExperience(state, customerId),
    adminDashboard: getAdminDashboard(state),
    catalog: getCommercialCatalog(),
    capabilities: {
      customerLive: false,
      adminLive: false,
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

  const activeSnapshot = runtimeSnapshot?.source === "supabase" ? runtimeSnapshot : demoSnapshot;
  const customerExperience = activeSnapshot.customerExperience;
  const adminDashboard = activeSnapshot.adminDashboard;
  const catalog = activeSnapshot.catalog;

  async function bookSlot(slotId: string) {
    if (activeSnapshot.source === "supabase") {
      if (!activeSnapshot.capabilities.customerLive) {
        throw new Error("This signed-in account does not have a live customer profile ready yet.");
      }

      const payload = await postRuntimeMutation("/api/runtime/bookings", {
        slotId,
      });
      setRuntimeSnapshot(payload.snapshot);
      return payload.message;
    }

    return runMutation((draft) => applyBookSlot(draft, slotId, customerId));
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

    return runMutation((draft) => applyWalletCredit(draft, targetCustomerId, amountInr, note));
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
    if (activeSnapshot.source === "supabase") {
      return "Live Supabase mode is active. Demo reset is only available when Sideout is running in demo mode.";
    }

    return resetDemoState();
  }

  return {
    runtimeSource: activeSnapshot.source,
    isSupabaseConfigured: hasSupabaseEnv,
    authStatus,
    customerExperience,
    adminDashboard,
    catalog,
    capabilities: activeSnapshot.capabilities,
    bookSlot,
    cancelBooking,
    approveBooking,
    addWalletCredit,
    bootstrapVenue,
    resetDemoState: reset,
  };
}
