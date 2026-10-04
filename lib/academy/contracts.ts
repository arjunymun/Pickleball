export type PaymentMode = "test" | "live" | "unconfigured";
export type AcademyRole = "customer" | "staff" | "owner";
export type BookingStatus = "held" | "confirmed" | "checked_in" | "completed" | "no_show" | "cancelled" | "expired";
export type PaymentStatus = "pending" | "paid" | "failed" | "refund_pending" | "partially_refunded" | "refunded" | "external" | "cash" | "not_required";
export type BookingSource = "online" | "walk_in" | "phone" | "playo" | "hudle" | "district" | "individual_play";
export type StaffBookingSource = Exclude<BookingSource, "online">;

export interface AcademyUser {
  id: string;
  email: string;
  name: string;
  role: AcademyRole;
}
export interface AcademyCourt { id: string; name: string; number: number }
export interface AcademyMembership {
  id: string;
  customerId: string;
  status: "pending" | "active" | "past_due" | "cancelled" | "expired";
  currentPeriodStart: string | null;
  paidThrough: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
}
export interface AcademySession {
  user: AcademyUser | null;
  configured: boolean;
  paymentMode: PaymentMode;
  membership: AcademyMembership | null;
}
export interface AcademySlot {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
  pricePaise: number;
}
export interface AvailabilityPayload {
  date: string;
  timezone: "Asia/Kolkata";
  courts: AcademyCourt[];
  slots: AcademySlot[];
  generatedAt: string;
}
export interface AcademyBooking {
  id: string;
  courtId: string;
  courtName: string;
  customerId: string | null;
  customerName: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  amountPaise: number;
  refundedPaise: number;
  holdExpiresAt: string | null;
  source: BookingSource;
  reference: string | null;
  reason: string | null;
  createdAt: string;
}
export interface AcademyBlock {
  id: string;
  courtId: string;
  startsAt: string;
  endsAt: string;
  reason: string;
}
export interface AcademyAttendance { id: string; customerId: string; date: string; checkedInAt: string }
export interface CustomerAccountPayload {
  user: AcademyUser;
  bookings: AcademyBooking[];
  membership: AcademyMembership | null;
  attendance: AcademyAttendance[];
  paymentMode: PaymentMode;
}
export interface CourtCheckoutPayload {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: "INR";
  bookingId: string;
  testMode: boolean;
}
export interface MembershipCheckoutPayload {
  keyId: string;
  subscriptionId: string;
  amountPaise: number;
  currency: "INR";
  testMode: boolean;
}
export interface AdminSchedulePayload {
  date: string;
  courts: AcademyCourt[];
  bookings: AcademyBooking[];
  blocks: AcademyBlock[];
  metrics: { bookingCount: number; collectedPaise: number; refundedPaise: number; occupiedHours: number };
  paymentMode: PaymentMode;
}
export interface AcademyCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  membership: AcademyMembership | null;
  attendance: AcademyAttendance[];
}
export interface AdminCustomersPayload { customers: AcademyCustomer[] }
export interface ApiErrorPayload { error: string; code?: string }
