// Bound stale project DNS, refresh retries and provider outages on every request.
export const boundedSupabaseFetch: typeof fetch = (input, init) => {
  const signal = init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(4000)])
    : AbortSignal.timeout(4000);
  return fetch(input, { ...init, signal, cache: "no-store" });
};
