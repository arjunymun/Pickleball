import { academyRoute, requireSameOrigin } from "@/lib/academy/http";
import {
  academyPayments,
  getAcademyReconciliation,
  requireAcademyUser,
} from "@/lib/academy/server";

export const maxDuration = 60;
export async function GET() {
  return academyRoute(getAcademyReconciliation);
}
export async function POST(request: Request) {
  return academyRoute(async () => {
    requireSameOrigin(request);
    await requireAcademyUser(true);
    return academyPayments(Date.now() + 20000).reconcile(20000);
  });
}
