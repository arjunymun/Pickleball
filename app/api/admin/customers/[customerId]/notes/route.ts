import { academyBody, academyRoute } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { noteInput, uuidInput } from "@/lib/academy/schema";
import { AcademyError } from "@/lib/academy/errors";
export async function POST(
  request: Request,
  context: { params: Promise<{ customerId: string }> },
) {
  return academyRoute(async () => {
    const user = await requireAcademyUser(true);
    const input = await academyBody(request, noteInput);
    const { customerId } = await context.params;
    if (!uuidInput.safeParse(customerId).success)
      throw new AcademyError("Invalid customer identifier.");
    return academyRepository().dispatch(
      "note",
      { ...input, customerId },
      user.id,
    );
  });
}
