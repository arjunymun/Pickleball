import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { attendanceInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser(true);
    return academyRepository().dispatch(
      "attendance",
      await academyBody(request, attendanceInput),
      user.id,
    );
  });
}
