import { SiteHeader } from "@/components/academy/site-header";
import { SiteFooter } from "@/components/academy/site-footer";
import { BookingReview } from "@/components/customer/booking-review";

export const metadata = {
  title: "Review your booking",
  robots: { index: false },
};
export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="academy-container">
        <BookingReview
          key={params.booking ?? "none"}
          bookingId={params.booking ?? null}
        />
      </main>
      <SiteFooter />
    </>
  );
}
