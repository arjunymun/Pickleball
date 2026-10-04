import { academyBody, academyRoute } from "@/lib/academy/http";
import { requireAcademyUser, academyPayments } from "@/lib/academy/server";
import { checkoutInput, uuidInput } from "@/lib/academy/schema";
import { AcademyError } from "@/lib/academy/errors";
export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  return academyRoute(async () => {
    const user = await requireAcademyUser();
    const input = await academyBody(request, checkoutInput);
    const { bookingId } = await context.params;
    if (!uuidInput.safeParse(bookingId).success)
      throw new AcademyError("Invalid booking identifier.");
    return academyPayments().courtCheckout(
      user.id,
      bookingId,
      input.idempotencyKey,
    );
  });
}
