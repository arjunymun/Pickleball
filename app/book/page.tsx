import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { CourtBooking } from "@/components/customer/court-booking";

export const metadata = { title: "Book a court" };
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; time?: string; court?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <CourtBooking
          initialDate={params.date}
          initialHour={params.time}
          initialCourt={params.court}
        />
      </main>
      <SiteFooter />
    </>
  );
}
