import { academyRoute } from "@/lib/academy/http";
import { getAcademyAvailability } from "@/lib/academy/server";
import { indiaDate } from "@/lib/academy/time";
export async function GET() {
  return academyRoute(async () => ({
    courts: (await getAcademyAvailability(indiaDate())).courts,
  }));
}
