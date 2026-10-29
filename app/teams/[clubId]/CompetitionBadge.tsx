import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getClubLeaguePhase } from "@/lib/uefa/fetch";
import type { LeaguePhaseComp } from "@/lib/uefa/types";
import { ordinal } from "@/lib/format";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

/** Each competition in its own colours — UEFA navy, Europa orange-on-black. */
const PILL: Record<LeaguePhaseComp["code"], string> = {
  CL: "bg-[#0b1d5b] text-white",
  EL: "bg-[#ff6b00] text-black",
};

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
  const phase = await getClubLeaguePhase(clubId);
  if (!phase) return null;

  const { comp, row } = phase;
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
