export const ACADEMY = {
  name: "Doon Pickleball Academy",
  location: "GMS Road, Dehradun",
  address: "11, Engineers Enclave Phase 1, GMS Road, Dehradun",
  phone: "+91 97980 98421",
  phoneHref: "tel:+919798098421",
  timezone: "Asia/Kolkata" as const,
  courtCount: 4,
  openingHour: 6,
  closingHour: 24,
  bookingWindowDays: 14,
  holdMinutes: 10,
  courtPricePaise: 50_000,
  memberCourtPricePaise: 40_000,
  individualPricePaise: 12_500,
  membershipPricePaise: 250_000,
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Doon+Pickleball+Academy+GMS+Road+Dehradun",
  photos: {
    daylight: "/images/academy-daylight.jpg",
    evening: "/images/academy-evening.jpg",
    reverse: "/images/academy-courts.jpg",
  },
} as const;

export function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
