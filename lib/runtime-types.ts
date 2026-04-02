import type { AdminDashboardSnapshot, CustomerExperienceSnapshot } from "@/lib/demo-state";

export interface RuntimeSnapshot {
  source: "demo" | "supabase";
  customerExperience: CustomerExperienceSnapshot;
  adminDashboard: AdminDashboardSnapshot;
  capabilities: {
    customerLive: boolean;
    adminLive: boolean;
  };
}

export interface RuntimeMutationResponse {
  message: string;
  snapshot: RuntimeSnapshot;
}
