import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { CourtBooking } from "@/components/customer/court-booking";
import { connection } from "next/server";

async function loadBookingClock() {
  await connection();
  return Date.now();
}

export const metadata = { title: "Book a court" };
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string | string[];
    time?: string | string[];
    court?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const initialNow = await loadBookingClock();
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <CourtBooking
          initialDate={first(params.date)}
          initialHour={first(params.time)}
          initialCourt={first(params.court)}
          initialNow={initialNow}
        />
      </main>
      <SiteFooter />
    </>
  );
}
