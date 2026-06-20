export type AdminRoleKind = "owner" | "staff";
export type ConfirmationMode = "instant" | "review";
export type SlotPaymentMode = "online" | "pay_at_venue" | "hybrid";
export type AvailabilityState = "open" | "limited" | "booked";
export type BookingStatus =
  | "held"
  | "payment_pending"
  | "payment_failed"
  | "expired"
  | "refunded"
  | "requested"
  | "confirmed"
  | "checked_in"
  | "canceled"
  | "completed"
  | "no_show"
  | "credited";
export type BookingPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
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

export interface VenueSettings {
  id: string;
  venueId: string;
  cancellationCutoffHours: number;
  bookingWindowDays: number;
  reminderLeadHours: number[];
  publicContactPhone: string;
  publicContactEmail: string;
  publicWhatsappNumber: string;
  memberDiscountPercent: number;
  featuredAnnouncement: string;
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
  stripeCustomerId?: string | null;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  joinedAt: string;
  favoriteWindow: string;
  skillBand: string;
  tags: string[];
  phoneE164?: string | null;
  whatsappOptIn?: boolean;
  communicationPreference?: "whatsapp" | "sms" | "email";
  lastContactedAt?: string | null;
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
  venueId?: string | null;
  courtId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  bookedAt: string;
  status: BookingStatus;
  paymentStatus: BookingPaymentStatus;
  attendees: number;
  totalAmountInr?: number | null;
  holdExpiresAt?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  confirmedAt?: string | null;
  checkedInAt?: string | null;
  completedAt?: string | null;
  noShowMarkedAt?: string | null;
  canceledAt?: string | null;
  creditedAt?: string | null;
}

export interface BookingPayment {
  id: string;
  bookingId: string;
  amountInr: number;
  mode: SlotPaymentMode | "wallet";
  status: BookingPaymentStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}

export interface OperatingHour {
  id: string;
  venueId: string;
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  slotDurationMinutes: number;
  isClosed: boolean;
}

export interface PriceRule {
  id: string;
  venueId: string;
  name: string;
  dayOfWeek: number | null;
  startsAt: string;
  endsAt: string;
  priceInr: number;
  memberPriceInr: number | null;
  priority: number;
}

export interface BookingHold {
  id: string;
  venueId: string;
  courtId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  status: "active" | "converted" | "expired" | "released";
  bookingId?: string | null;
  stripeCheckoutSessionId?: string | null;
  createdAt: string;
}

export interface AdminBlock {
  id: string;
  venueId: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
  createdAt: string;
}

export interface StripeCheckoutSessionRecord {
  id: string;
  venueId: string;
  bookingId: string | null;
  holdId: string | null;
  customerId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  amountInr: number;
  status: "open" | "complete" | "expired" | "failed";
  createdAt: string;
  completedAt?: string | null;
}

export interface StripeWebhookEventRecord {
  id: string;
  stripeEventId: string;
  eventType: string;
  processedAt: string;
}

export interface PackProduct {
  id: string;
  name: string;
  priceInr: number;
  includedCredits: number;
  validDays: number;
  description: string;
  stripePriceId?: string | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  monthlyPriceInr: number;
  includedCredits: number;
  perks: string[];
  stripePriceId?: string | null;
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
  stripeSubscriptionId?: string | null;
  currentPeriodEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
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
  discountInr: number;
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

export interface OperatorActivityLog {
  id: string;
  venueId: string;
  actorUserId: string | null;
  customerId: string | null;
  bookingId: string | null;
  action: string;
  detail: string;
  createdAt: string;
}

export interface CommunicationTemplate {
  id: string;
  venueId: string;
  slug: string;
  channel: "whatsapp";
  title: string;
  body: string;
}

export interface CommunicationDelivery {
  id: string;
  venueId: string;
  customerId: string;
  bookingId: string | null;
  templateId: string | null;
  channel: "whatsapp";
  direction: "outbound";
  status: "queued" | "sent" | "delivered" | "failed";
  provider: string;
  providerMessageId: string | null;
  body: string;
  sentAt: string;
}
