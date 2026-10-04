import { CustomerAccount } from "@/components/customer/customer-account";
export const metadata = { title: "Your bookings" };
export default function BookingsPage() {
  return <CustomerAccount bookingsOnly />;
}
