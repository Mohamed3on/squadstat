"use client";

import { useCallback, startTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function useQueryParams(basePath: string) {
  const params = useSearchParams();
  const router = useRouter();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }

      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
    },
    [router, params, basePath]
  );

  return { params, update };
}
