"use client";

import { useCallback, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function useQueryParams(basePath: string) {
  const params = useSearchParams();
  const router = useRouter();

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

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => { router.replace(buildUrl(updates), { scroll: false }); });
    },
    [router, buildUrl]
  );

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      startTransition(() => { router.push(buildUrl(updates), { scroll: false }); });
    },
    [router, buildUrl]
  );

  return { params, update, push };
}
