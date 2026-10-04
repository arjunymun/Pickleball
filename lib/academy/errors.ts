export class AcademyError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "INVALID_REQUEST",
  ) {
    super(message);
    this.name = "AcademyError";
  }
}

export function unavailable(): AcademyError {
  return new AcademyError(
    "Online booking is temporarily unavailable. Please call the academy.",
    503,
    "BACKEND_UNAVAILABLE",
  );
}

export function translateDatabaseError(error: {
  code?: string;
  message?: string;
}): AcademyError {
  const known: Record<string, [number, string]> = {
    AUTH_REQUIRED: [401, "Please sign in to continue."],
    FORBIDDEN: [403, "Staff access is required."],
    NOT_FOUND: [404, "That record was not found."],
    CONFLICT: [409, "That court time is no longer available."],
    HOLD_EXPIRED: [409, "Your hold has expired. Choose a new court time."],
    INVALID_TRANSITION: [409, "That action is not available for this booking."],
    IDEMPOTENCY_CONFLICT: [
      409,
      "This request key was already used for a different action.",
    ],
    PAYMENT_IN_PROGRESS: [
      409,
      "Payment setup is already in progress. Please retry shortly.",
    ],
    RECONCILIATION_REQUIRED: [
      503,
      "Payment setup needs reconciliation. Please try again later.",
    ],
    MEMBER_REQUIRED: [409, "An active paid membership is required."],
    BENEFIT_USED: [
      409,
      "This member's included hour has already been recorded today.",
    ],
    INVALID_REQUEST: [400, "Check the details and try again."],
  };
  const entry = known[error.message ?? ""];
  if (entry) return new AcademyError(entry[1], entry[0], error.message);
  if (error.code === "23P01" || error.code === "23505")
    return new AcademyError(
      "That court time or request is already reserved.",
      409,
      "CONFLICT",
    );
  return unavailable();
}
