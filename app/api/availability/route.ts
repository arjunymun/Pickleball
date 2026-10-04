import { academyRoute } from "@/lib/academy/http";
import {
  getAcademyAvailability,
  validateAcademyDate,
} from "@/lib/academy/server";
export async function GET(request: Request) {
  return academyRoute(() =>
    getAcademyAvailability(
      validateAcademyDate(new URL(request.url).searchParams.get("date")),
    ),
  );
}
