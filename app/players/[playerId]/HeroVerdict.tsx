"use client";

import { useSearchParams } from "next/navigation";
import { paramsToScope, type ComparisonScope } from "@/lib/comparison-scope";
import type { PlayerSignalSummary } from "@/lib/player-detail";

function PeerCount({ count, tone }: { count: number; tone: string }) {
  return <span className={`font-value ${count > 0 ? tone : "text-text-secondary"}`}>{count}</span>;
}

/**
 * The hero's one-line answer to "is he worth it": how many pricier peers he's beating and how
 * many cheaper peers are ahead of him, under the scope the comparison lists below are set to.
 * Always present, so a screenshot of the hero carries the verdict even when it's neutral.
 */
export function HeroVerdict({
  signalSummaries,
  leagueLabel,
}: {
  signalSummaries: Record<ComparisonScope, PlayerSignalSummary>;
  leagueLabel: string;
}) {
  const params = useSearchParams();
  const scope = paramsToScope({
    sameLeague: params.get("sameLeague"),
    allLeagues: params.get("allLeagues"),
    top5: params.get("top5"),
  });
  const { pricierPlayersBeatenByTarget: beaten, cheaperPlayersBeatingTarget: ahead } =
    signalSummaries[scope];
  // Costing more is already the whole qualification for a beaten peer, so the pricier side stays
  // unqualified under the default scope; the cheaper side names the league bar it cleared.
  const scopeSuffix = (peer: "pricier" | "cheaper") =>
    ({
      all: "",
      noLeagueEdge: peer === "pricier" ? "" : " in same or stronger leagues",
      league: ` in ${leagueLabel}`,
      top5: " in the top 5 leagues",
    })[scope];
  const peers = (n: number) => (n === 1 ? "peer" : "peers");

  return (
    <div className="border-t border-border-subtle pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Price vs output</p>
        <a
          href="#comparisons"
          className="text-xs text-text-secondary transition-colors hover:text-text-primary"
        >
          See who ↓
        </a>
      </div>
      <p className="mt-1.5 text-sm text-text-secondary">
        {beaten === 0 && ahead === 0 ? (
          <>
            In line with his price: no pricier peer{scopeSuffix("pricier")} behind him, no cheaper
            peer{scopeSuffix("cheaper")} ahead
          </>
        ) : (
          <>
            Beating <PeerCount count={beaten} tone="text-accent-hot" /> pricier {peers(beaten)}
            {scopeSuffix("pricier")} · <PeerCount count={ahead} tone="text-accent-cold-soft" />{" "}
            cheaper {peers(ahead)}
            {scopeSuffix("cheaper")} ahead of him
          </>
        )}
      </p>
    </div>
  );
}
