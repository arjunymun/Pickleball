import { academyBody, academyRoute } from "@/lib/academy/http";
import { requireAcademyUser, academyPayments } from "@/lib/academy/server";
import { checkoutInput } from "@/lib/academy/schema";
export async function POST(request: Request) {
  return academyRoute(async () => {
    const user = await requireAcademyUser();
    const input = await academyBody(request, checkoutInput);
    return academyPayments().membershipCheckout(user.id, input.idempotencyKey);
  });
}
