import { academyRoute } from "@/lib/academy/http";
import { getAcademySchedule, validateAcademyDate } from "@/lib/academy/server";
export async function GET(request: Request) {
  return academyRoute(() =>
    getAcademySchedule(
      validateAcademyDate(new URL(request.url).searchParams.get("date")),
    ),
  );
}
