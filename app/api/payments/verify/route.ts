import { academyBody, academyRoute } from "@/lib/academy/http";
import { requireAcademyUser, academyPayments } from "@/lib/academy/server";
import { verifyInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser();
    return academyPayments().verifyCourt(
      user.id,
      await academyBody(request, verifyInput),
    );
  });
}
