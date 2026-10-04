import { academyRoute, requireSameOrigin } from "@/lib/academy/http";
import { requireAcademyUser, academyPayments } from "@/lib/academy/server";
export async function POST(request: Request) {
  return academyRoute(async () => {
    requireSameOrigin(request);
    const user = await requireAcademyUser();
    return academyPayments().cancelMembership(user.id);
  });
}
