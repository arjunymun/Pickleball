import { academyRoute } from "@/lib/academy/http";
import { getAcademySession } from "@/lib/academy/server";
export async function GET() {
  return academyRoute(getAcademySession);
}
