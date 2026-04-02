export type AdminRoleKind = "owner" | "staff";
export type ConfirmationMode = "instant" | "review";
export type SlotPaymentMode = "online" | "pay_at_venue" | "hybrid";
export type AvailabilityState = "open" | "limited" | "booked";
export type BookingStatus =
  | "requested"
  | "confirmed"
  | "canceled"
  | "completed"
  | "no_show"
  | "credited";
export type BookingPaymentStatus =
  | "pending"
  | "paid_online"
  | "pay_at_venue"
  | "credit_applied";
export type OfferStatus = "active" | "scheduled" | "expired";
export type WalletEntryKind =
  | "credit_added"
  | "credit_spent"
  | "pack_restored"
  | "promo_credit"
  | "membership_benefit_credit"
  | "manual_adjustment"
  | "refund_credit";

export interface Venue {
  id: string;
  name: string;
  tagline: string;
  location: string;
  timezone: string;
  story: string;
}

export interface Court {
  id: string;
  name: string;
  surface: string;
  lighting: boolean;
  outlook: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  joinedAt: string;
  favoriteWindow: string;
  skillBand: string;
  tags: string[];
}

export interface AdminRole {
  id: string;
  userId: string;
  venueId: string;
  kind: AdminRoleKind;
}

export interface SlotTemplate {
  id: string;
  name: string;
  durationMinutes: number;
  confirmationMode: ConfirmationMode;
  paymentMode: SlotPaymentMode;
  priceInr: number;
  description: string;
}

export interface BookableSlot {
  id: string;
  templateId: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  capacity: number;
  priceInr: number;
  paymentMode: SlotPaymentMode;
  confirmationMode: ConfirmationMode;
  availabilityState: AvailabilityState;
  label: string;
}

export interface Booking {
  id: string;
  slotId: string;
  customerId: string;
  bookedAt: string;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  attendees: number;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  amountInr: number;
  mode: SlotPaymentMode | "wallet";
  status: BookingPaymentStatus;
}

export interface PackProduct {
  id: string;
  name: string;
  priceInr: number;
  includedCredits: number;
  validDays: number;
  description: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  monthlyPriceInr: number;
  includedCredits: number;
  perks: string[];
}

export interface CustomerPack {
  id: string;
  customerId: string;
  productId: string;
  creditsRemaining: number;
  expiresAt: string;
}

export interface CustomerMembership {
  id: string;
  customerId: string;
  planId: string;
  status: "active" | "paused" | "expired";
  renewsAt: string;
}

export interface WalletLedgerEntry {
  id: string;
  customerId: string;
  createdAt: string;
  amountInr: number;
  kind: WalletEntryKind;
  note: string;
}

export interface Offer {
  id: string;
  name: string;
  status: OfferStatus;
  startsAt: string;
  endsAt: string;
  headline: string;
  audience: string;
  redemptionCap: number;
  slotScope: string;
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  customerId: string;
  redeemedAt: string;
  creditValueInr: number;
}

export interface AttendanceEvent {
  id: string;
  bookingId: string;
  customerId: string;
  attendedAt: string;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  authoredBy: string;
  createdAt: string;
  body: string;
}
