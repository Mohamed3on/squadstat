import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getCompClubs, getCompSeason } from "@/lib/cl/fetch";
import { buildClModel } from "@/lib/cl/model";
import { COMPETITIONS, type CompCode } from "@/lib/cl/types";
import { ordinal } from "@/lib/format";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

/** Each competition in its own colours — UEFA navy, Europa orange-on-black. */
const PILL: Record<CompCode, string> = {
  CL: "bg-[#0b1d5b] text-white",
  EL: "bg-[#ff6b00] text-black",
};
const CODES = Object.keys(PILL) as CompCode[];

/**
 * A mark, not a sentence: the competition crest on a coloured pill beside the
 * domestic league badge, for the 36 clubs in either league phase. The name and
 * the league-phase place ride in the tooltip and the label, so the row stays two
 * badges wide. Nothing renders for the many clubs outside both.
 *
 * Same shape as `ClubWindowBadges`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function CompetitionBadge({ clubId }: { clubId: string }) {
  // Both rosters at once: a club is in at most one of them, and there is no
  // cheaper way to find out which than asking.
  const rosters = await Promise.all(CODES.map((c) => getCompClubs(c).catch(() => null)));
  const i = rosters.findIndex((r) => r?.some((c) => c.id === clubId));
  if (i < 0) return null;

  const comp = COMPETITIONS[CODES[i]];
  const season = await getCompSeason(comp.code).catch(() => null);
  const row = season
    ? buildClModel(rosters[i]!, season).rows.find((r) => r.club.id === clubId)
    : null;
  const place = row && row.pl > 0 ? row.pos : null;
  const label = place ? `${comp.name} · ${ordinal(place)} in league phase` : comp.name;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={`/leagues/${comp.slug}`} aria-label={label}>
          <Badge
            className={`gap-1 border-transparent px-1.5 transition-opacity hover:opacity-80 ${PILL[comp.code]}`}
          >
            <img
              src={leagueLogoUrl(comp.code)}
              alt=""
              className="h-3.5 w-3.5 rounded-sm bg-white/90 object-contain p-px"
            />
            {place !== null && (
              <span className="font-value text-[10px] sm:text-xs">{ordinal(place)}</span>
            )}
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
