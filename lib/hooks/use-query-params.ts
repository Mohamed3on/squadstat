"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useQueryParams(basePath: string) {
  const router = useRouter();
  const params = useSearchParams();

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [params, basePath]
  );

  // Shallow URL update — no server re-render
  const update = useCallback(
    (updates: Record<string, string | null>) => {
      window.history.pushState(null, "", buildUrl(updates));
    },
    [buildUrl]
  );

  // Full navigation — triggers server re-render
  const push = useCallback(
    (updates: Record<string, string | null>) => {
      router.push(buildUrl(updates), { scroll: false });
    },
    [router, buildUrl]
  );

  return { params, update, push };
}
