import { academyRoute } from "@/lib/academy/http";
import { getAcademyAccount } from "@/lib/academy/server";
export async function GET() {
  return academyRoute(getAcademyAccount);
}
