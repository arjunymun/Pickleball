import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { staffBookingInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser(true);
    return academyRepository().dispatch(
      "manual_booking",
      await academyBody(request, staffBookingInput),
      user.id,
    );
  });
}
