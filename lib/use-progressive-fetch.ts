"use client";

import { useState, useEffect, useMemo, useRef } from "react";

/**
 * Fire fetches for all keys in parallel, accumulating results as each resolves.
 * Returns results array and a Set of still-pending keys.
 */
export function useProgressiveFetch<T>(
  keys: string[],
  fetchFn: (key: string) => Promise<T>,
) {
  const [results, setResults] = useState<T[]>([]);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const stableKey = useMemo(() => keys.join("\0"), [keys]);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    if (keys.length === 0) return;
    setPending(new Set(keys));
    setResults([]);
    let cancelled = false;

    for (const key of keys) {
      fetchRef.current(key)
        .then((result) => {
          if (cancelled) return;
          setResults((prev) => [...prev, result]);
        })
        .catch(() => {})
        .finally(() => {
          if (cancelled) return;
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        });
    }

    return () => { cancelled = true; };
  }, [stableKey]);

  return { results, pending };
}
