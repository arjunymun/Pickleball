import type { PaymentMode } from "@/lib/academy/contracts";

export interface AdminReconciliationPayload {
  paymentMode: PaymentMode;
  generatedAt: string;
  attempts: Array<{
    id: string;
    kind: "court" | "membership";
    bookingId: string | null;
    customerName: string;
    amountPaise: number;
    providerId: string | null;
    status: "creating" | "reconcile" | "ready";
    createdAt: string;
    lastCheckedAt: string | null;
  }>;
  refunds: Array<{
    id: string;
    bookingId: string;
    customerName: string;
    paymentId: string;
    providerRefundId: string | null;
    amountPaise: number;
    status: "pending" | "failed";
    reason: string;
    createdAt: string;
    lastCheckedAt: string | null;
  }>;
  cancellations: Array<{
    id: string;
    customerName: string;
    subscriptionId: string | null;
    createdAt: string;
    lastCheckedAt: string | null;
  }>;
  webhooks: { failed: number; processing: number };
  instructions: string[];
}
export interface ReconciliationResult {
  processed: number;
  failed: number;
  unresolved: number;
}
