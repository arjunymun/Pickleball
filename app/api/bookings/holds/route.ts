import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { gatewayConfig, gatewayUnavailable } from "@/lib/academy/gateway";
import { holdInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser();
    if (!gatewayConfig()) throw gatewayUnavailable();
    return academyRepository().dispatch(
      "hold",
      await academyBody(request, holdInput),
      user.id,
    );
  });
}
