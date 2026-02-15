"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useQueryParams(basePath: string) {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [router, params, basePath]
  );

  return { params, update, push: update };
}
