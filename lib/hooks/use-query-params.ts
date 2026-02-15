"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useQueryParams(basePath: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [params, setParams] = useState(() => new URLSearchParams(searchParams.toString()));
  const ref = useRef(params);
  ref.current = params;
  const baseRef = useRef(basePath);
  baseRef.current = basePath;

  useEffect(() => {
    setParams(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  const update = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(ref.current.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    ref.current = next;
    setParams(next);
    const qs = next.toString();
    window.history.replaceState(window.history.state, "", qs ? `${baseRef.current}?${qs}` : baseRef.current);
  }, []);

  const push = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(ref.current.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    ref.current = next;
    setParams(next);
    const qs = next.toString();
    router.push(qs ? `${baseRef.current}?${qs}` : baseRef.current, { scroll: false });
  }, [router]);

  return { params, update, push };
}
