import { BookingStatus } from "./booking-status";
export const metadata = { title: "Booking status" };
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const params = await searchParams;
  return (
    <BookingStatus
      key={params.booking ?? "none"}
      bookingId={params.booking ?? null}
    />
  );
}
