import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { actionInput, uuidInput } from "@/lib/academy/schema";
import { AcademyError } from "@/lib/academy/errors";
export async function POST(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  return academyRoute(async () => {
    const user = await requireAcademyUser(true);
    const input = await academyBody(request, actionInput);
    const { bookingId } = await context.params;
    if (!uuidInput.safeParse(bookingId).success)
      throw new AcademyError("Invalid booking identifier.");
    return academyRepository().dispatch(
      "booking_action",
      { ...input, bookingId },
      user.id,
    );
  });
}
