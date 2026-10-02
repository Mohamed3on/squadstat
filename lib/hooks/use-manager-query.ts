import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ManagerInfo } from "@/app/types";

/** `officialOnly` strips friendlies from the PPG: a different answer, so its own key. */
export const managerQueryOptions = (clubId: string, officialOnly = false) => ({
  queryKey: officialOnly
    ? (["manager", clubId, "official"] as const)
    : (["manager", clubId] as const),
  queryFn: () =>
    fetch(`/api/manager/${clubId}${officialOnly ? "?official=1" : ""}`)
      .then((r: Response) => r.json())
      .then((d: { manager?: ManagerInfo | null }) => d.manager ?? null),
  staleTime: 86400_000,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

/** Fetches managers for many clubs at once, returning a lookup map and a loading set. */
export function useManagersMap(clubIds: string[], officialOnly = false) {
  const queries = useQueries({
    queries: clubIds.map((clubId) => managerQueryOptions(clubId, officialOnly)),
  });

  return useMemo(() => {
    const managersMap: Record<string, ManagerInfo | null> = {};
    const loadingSet = new Set<string>();
    queries.forEach((q, i) => {
      if (q.data !== undefined) managersMap[clubIds[i]] = q.data;
      if (q.isLoading) loadingSet.add(clubIds[i]);
    });
    return { managersMap, loadingSet };
  }, [queries, clubIds]);
}
