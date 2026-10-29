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
 * Only the side, or sides, the callout names get it, so a club two points off its
 * value slot stays quiet while the one six clear says so.
 *
 * Same shape as `ClubWindowBadges`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function CompetitionGapBadge({ clubId }: { clubId: string }) {
  const phase = await getClubLeaguePhase(clubId);
  if (!phase?.view || !phase.row) return null;
  const { comp, view, row } = phase;

  // Measured as the competition page measures it: points while the table runs,
  // places once it has settled.
  const places = view.complete;
  const gaps = biggestGaps(view.rows, (r) => (places ? r.posDelta : r.ptsDelta));
  const gap =
    gaps && [gaps.over, gaps.under].find((g) => g.sides.some((r) => r.club.id === clubId));
  if (!gap) return null;

  const over = gap === gaps.over;
  const size = Math.abs(gap.value);
  const unit = places ? "places" : "pts";
  const others = gap.sides.length - 1;

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
          {over ? "▲" : "▼"} {size} {unit}
        </span>
      </Link>
      <InfoTip className="ml-1">
        <p>
          <span className="font-value">{ordinal(row.pos)}</span> in the league phase,{" "}
          <span className="font-value">{ordinal(row.valueRank)}</span> on value per player:{" "}
          {places ? (
            <>
              <span className="font-value">{size}</span> places {over ? "above" : "below"} its money
            </>
          ) : (
            <>
              <span className="font-value">{size}</span> points {over ? "clear of" : "short of"} the
              club at its value rank
            </>
          )}
          , the biggest gap {over ? "above" : "below"} the money of all{" "}
          <span className="font-value">{view.rows.length}</span>
          {others > 0 && (
            <>
              , level with <span className="font-value">{others}</span>{" "}
              {others === 1 ? "other" : "others"}
            </>
          )}
          .
        </p>
        <p className="mt-1.5">
          After matchday <span className="font-value">{view.matchday}</span> of{" "}
          <span className="font-value">{view.matchdays}</span>.
        </p>
      </InfoTip>
    </SignalBadge>
  );
}
