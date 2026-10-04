import { academyRoute } from "@/lib/academy/http";
import { getAcademyCustomers } from "@/lib/academy/server";
export async function GET() {
  return academyRoute(getAcademyCustomers);
}
