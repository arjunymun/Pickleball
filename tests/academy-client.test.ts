import { afterEach, describe, expect, it, vi } from "vitest";
import { academyFetch } from "@/lib/academy/client";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("academy request cancellation", () => {
  it("times out a stalled request even when the caller supplies a signal", async () => {
    vi.useFakeTimers();
    const caller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_path, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true },
            );
          }),
      ),
    );
    const request = academyFetch("/api/session", { signal: caller.signal });
    const result = expect(request).rejects.toMatchObject({
      status: 503,
      message: "The request took too long. Please try again.",
    });
    await vi.advanceTimersByTimeAsync(15_000);
    await result;
    expect(caller.signal.aborted).toBe(false);
  });

  it("passes caller cancellation to the actual network request", async () => {
    const caller = new AbortController();
    let networkSignal: AbortSignal | null | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_path, init: RequestInit) => {
        networkSignal = init.signal;
        return Promise.resolve(
          new Response(JSON.stringify({ configured: false }), { status: 200 }),
        );
      }),
    );
    await academyFetch("/api/session", { signal: caller.signal });
    caller.abort();
    expect(networkSignal?.aborted).toBe(true);
  });
});
