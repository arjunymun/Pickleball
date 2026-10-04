"use client";

import { useCallback, useEffect, useState } from "react";
import { academyFetch } from "@/lib/academy/client";

export function useCustomerData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await academyFetch<T>(path, {
          signal: controller.signal,
        });
        if (active) {
          setData(result);
          setLoadedPath(path);
        }
      } catch (cause) {
        if (active) {
          setData(null);
          setLoadedPath(path);
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, revision]);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  return {
    data: loadedPath === path ? data : null,
    error: loadedPath === path ? error : null,
    loading: loading || loadedPath !== path,
    refresh,
  };
}
