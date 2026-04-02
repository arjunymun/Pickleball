import type {
  AdminDashboardSnapshot,
  CommercialCatalogSnapshot,
  CustomerExperienceSnapshot,
} from "@/lib/demo-state";
import type { BookableSlot, Offer, Venue, VenueSettings } from "@/lib/domain";

export type RuntimeAuthStatus = "signed_in" | "signed_out";
export type RuntimeSetupStatus = "demo" | "needs_bootstrap" | "live";

export interface RuntimeViewer {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  primaryRole: "guest" | "customer" | "staff" | "owner";
}

export interface RuntimePublicSiteSnapshot {
  venue: Venue;
  venueSettings: VenueSettings | null;
  featuredSlots: BookableSlot[];
  featuredOffers: Offer[];
  metrics: {
    courtCount: number;
    repeatPlayRate: number;
    offersRedeemed: number;
    creditsExpiringSoon: number;
  };
}

export interface RuntimeSnapshot {
  source: "demo" | "supabase";
  auth: {
    status: RuntimeAuthStatus;
    viewer: RuntimeViewer;
  };
  setup: {
    status: RuntimeSetupStatus;
    venueId: string | null;
    canBootstrapVenue: boolean;
  };
  publicSite: RuntimePublicSiteSnapshot;
  venueSettings: VenueSettings | null;
  customerExperience: CustomerExperienceSnapshot;
  adminDashboard: AdminDashboardSnapshot;
  catalog: CommercialCatalogSnapshot;
  capabilities: {
    customerLive: boolean;
    adminLive: boolean;
    commerceLive: boolean;
    messagingLive: boolean;
    pwaReady: boolean;
  };
}

export interface RuntimeMutationResponse {
  message: string;
  snapshot: RuntimeSnapshot;
}
