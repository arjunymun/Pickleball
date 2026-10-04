import { academyRoute, requireSameOrigin } from "@/lib/academy/http";
import { academyRepository } from "@/lib/academy/repository";
import { requireAcademyUser } from "@/lib/academy/server";
import { uuidInput } from "@/lib/academy/schema";
import { AcademyError } from "@/lib/academy/errors";
export async function DELETE(
  request: Request,
  context: { params: Promise<{ blockId: string }> },
) {
  return academyRoute(async () => {
    requireSameOrigin(request);
    const user = await requireAcademyUser(true);
    const { blockId } = await context.params;
    if (!uuidInput.safeParse(blockId).success)
      throw new AcademyError("Invalid block identifier.");
    return academyRepository().dispatch("delete_block", { blockId }, user.id);
  });
}
