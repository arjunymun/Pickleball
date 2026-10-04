import { AcademyError } from "@/lib/academy/errors";

export async function bootstrapLiveVenueForAuthUser(): Promise<never> {
  throw new AcademyError(
    "Portfolio bootstrap is retired. Apply the academy migration and assign staff through the private setup procedure.",
    410,
    "LEGACY_ENDPOINT_RETIRED",
  );
}
