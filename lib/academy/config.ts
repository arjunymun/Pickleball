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
  mapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2928.6424939924436!2d78.0065358!3d30.3109537!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39092b7059578147%3A0x4fd838451db54ed2!2sDoon%20Pickleball%20Academy!5e1!3m2!1sen!2sca!4v1791320113504!5m2!1sen!2sca",
  photos: {
    courts: "/images/academy-evening.jpg",
    evening: "/images/academy-evening.jpg",
  },
} as const;

export function formatMoney(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: paise % 100 === 0 ? 0 : 2 }).format(paise / 100);
}
