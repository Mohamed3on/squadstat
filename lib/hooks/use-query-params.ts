"use client";

import { useCallback, useSyncExternalStore } from "react";

function getSearchParams() {
  return new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
}

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

export function useQueryParams(basePath: string) {
  const params = useSyncExternalStore(subscribe, getSearchParams, getSearchParams);

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
      const url = buildUrl(updates);
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [buildUrl]
  );

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const url = buildUrl(updates);
      window.history.pushState(null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [buildUrl]
  );

  return { params, update, push };
}
