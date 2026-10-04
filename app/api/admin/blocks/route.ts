import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { blockInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser(true);
    return academyRepository().dispatch(
      "block",
      await academyBody(request, blockInput),
      user.id,
    );
  });
}
