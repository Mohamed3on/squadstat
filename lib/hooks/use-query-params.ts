"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

function getSearch() {
  return typeof window === "undefined" ? "" : window.location.search;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function useQueryParams(basePath: string) {
  const search = useSyncExternalStore(subscribe, getSearch, getSearch);
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath]
  );

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      window.history.replaceState(null, "", buildUrl(updates));
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [buildUrl]
  );

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      window.history.pushState(null, "", buildUrl(updates));
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [buildUrl]
  );

  return { params, update, push };
}
