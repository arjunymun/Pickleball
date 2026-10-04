import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => ({ cookies: vi.fn(), getUser: vi.fn(), repair: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: fixtures.cookies }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser: fixtures.getUser } })) }));
vi.mock("@/lib/academy/repository", () => ({ academyRepository: () => ({ dispatch: fixtures.repair }) }));
import { getAcademySession, requireAcademyUser } from "@/lib/academy/server";

describe("academy verified sessions", () => {
  beforeEach(() => {
    vi.stubEnv("ACADEMY_BACKEND_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://fixture.invalid");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-fixture");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "private-fixture");
    fixtures.cookies.mockReset().mockResolvedValue({ getAll: () => [] });
    fixtures.getUser.mockReset(); fixtures.repair.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());
  it("returns explicit disabled configuration without querying stale credentials", async () => {
    vi.stubEnv("ACADEMY_BACKEND_ENABLED", "false");
    expect(await getAcademySession()).toMatchObject({ configured: false, user: null, membership: null });
    expect(fixtures.getUser).not.toHaveBeenCalled();
    expect(fixtures.repair).not.toHaveBeenCalled();
  });
  it("does not make auth network requests for anonymous public visitors", async () => {
    expect(await getAcademySession()).toMatchObject({ configured: true, user: null });
    expect(fixtures.getUser).not.toHaveBeenCalled();
  });
  it("fails explicitly during auth outage without returning demo identity", async () => {
    fixtures.cookies.mockResolvedValue({ getAll: () => [{ name: "sb-fixture-auth-token", value: "fixture-cookie" }] });
    fixtures.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 503 } });
    await expect(getAcademySession()).rejects.toMatchObject({ status: 503, code: "BACKEND_UNAVAILABLE" });
    expect(fixtures.repair).not.toHaveBeenCalled();
  });
  it("repairs the verified user using metadata only for display, never role", async () => {
    fixtures.cookies.mockResolvedValue({ getAll: () => [{ name: "sb-fixture-auth-token", value: "fixture-cookie" }] });
    fixtures.getUser.mockResolvedValue({ data: { user: { id: "verified-id", email: "fixture@example.invalid", phone: "", user_metadata: { full_name: "Fixture player", role: "owner", primaryRole: "staff" } } }, error: null });
    fixtures.repair.mockResolvedValue({ user: { id: "verified-id", email: "fixture@example.invalid", name: "Fixture player", role: "customer" }, membership: null });
    expect((await getAcademySession()).user?.role).toBe("customer");
    expect(fixtures.repair).toHaveBeenCalledWith("repair_customer", { email: "fixture@example.invalid", name: "Fixture player", phone: null }, "verified-id");
    await expect(requireAcademyUser(true)).rejects.toMatchObject({ status: 403 });
  });
});
