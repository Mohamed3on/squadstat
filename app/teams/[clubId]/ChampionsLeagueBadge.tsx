import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getClClubs, getClSeason } from "@/lib/cl/fetch";
import { buildClModel } from "@/lib/cl/model";
import { ordinal } from "@/lib/format";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

/**
 * A mark, not a sentence: the Champions League crest on a navy pill beside
 * the domestic league badge, for the 36 clubs in this season's league phase.
 * The name and the league-phase place ride in the tooltip and the label, so
 * the row stays two badges wide. Nothing renders for the many clubs outside.
 *
 * Same shape as `ClubWindowBadges`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function ChampionsLeagueBadge({ clubId }: { clubId: string }) {
  const clubs = await getClClubs().catch(() => null);
  if (!clubs?.some((c) => c.id === clubId)) return null;

  const season = await getClSeason().catch(() => null);
  const row = season ? buildClModel(clubs, season).rows.find((r) => r.club.id === clubId) : null;
  const place = row && row.pl > 0 ? row.pos : null;
  const label = place ? `Champions League · ${ordinal(place)} in league phase` : "Champions League";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/leagues/champions-league" aria-label={label}>
          <Badge className="gap-1 border-transparent bg-[#0b1d5b] px-1.5 text-white transition-opacity hover:opacity-80">
            <img
              src={leagueLogoUrl("CL")}
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
