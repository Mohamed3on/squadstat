import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { InfoTip } from "@/app/components/InfoTip";
import { SignalBadge } from "@/components/SignalBadge";
import { ordinal } from "@/lib/format";
import { getClubLeaguePhase } from "@/lib/uefa/fetch";
import { biggestGaps } from "@/lib/uefa/model";
import { compHref } from "@/lib/uefa/types";

/**
 * The competition page's callout, carried onto the club's own: the club furthest
 * above or below its money in the Champions League or Europa League league phase.
 *
 * Same shape as `ClubWindowBadges`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function CompetitionGapBadge({ clubId }: { clubId: string }) {
  const phase = await getClubLeaguePhase(clubId);
  if (!phase?.view) return null;
  const { comp, view } = phase;
  const gaps = biggestGaps(view);
  const gap =
    gaps && [gaps.over, gaps.under].find((g) => g.sides.some((r) => r.club.id === clubId));
  if (!gap) return null;

  const row = gap.sides.find((r) => r.club.id === clubId)!;
  const over = gap.value > 0;

  return (
    <SignalBadge
      className={
        over
          ? "border-accent-hot-border bg-accent-hot-glow text-accent-hot"
          : "border-accent-cold-border bg-accent-cold-glow text-accent-cold-soft"
      }
    >
      {over ? (
        <TrendingUp className="mr-1 h-3.5 w-3.5" />
      ) : (
        <TrendingDown className="mr-1 h-3.5 w-3.5" />
      )}
      <Link href={compHref(comp)} className="hover:underline">
        Biggest {comp.name} {over ? "overperformer" : "underperformer"} ·{" "}
        <span className="font-value">
          {over ? "▲" : "▼"} {Math.abs(gap.value)} {view.complete ? "places" : "pts"}
        </span>
      </Link>
      <InfoTip className="ml-1">
        <p>
          <span className="font-value">{ordinal(row.pos)}</span> in the league phase,{" "}
          <span className="font-value">{ordinal(row.valueRank)}</span> on value per player, after
          matchday <span className="font-value">{view.matchday}</span> of{" "}
          <span className="font-value">{view.matchdays}</span>.
        </p>
      </InfoTip>
    </SignalBadge>
  );
}
