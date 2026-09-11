import Link from "next/link";
import { SignalBadge } from "@/components/SignalBadge";
import { getClClubs, getClSeason } from "@/lib/cl/fetch";
import { buildClModel } from "@/lib/cl/model";
import { ordinal } from "@/lib/format";
import { leagueLogoUrl } from "@/lib/transfermarkt/image";

/**
 * A quiet mark that this club is in this season's Champions League, with its
 * league-phase place once games have been played.
 *
 * Deliberately muted next to the domestic league badge: the domestic league is
 * where the club lives, the cup is a fact about its season. Nothing renders for
 * the many clubs outside the 36.
 *
 * Same shape as `SquadValueBadge`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function ChampionsLeagueBadge({ clubId }: { clubId: string }) {
  const clubs = await getClClubs().catch(() => null);
  if (!clubs?.some((c) => c.id === clubId)) return null;

  const season = await getClSeason().catch(() => null);
  const row = season ? buildClModel(clubs, season).rows.find((r) => r.club.id === clubId) : null;
  const place = row && row.pl > 0 ? row.pos : null;

  return (
    <SignalBadge className="border-border-subtle bg-card-hover text-text-secondary">
      <Link
        href="/leagues/champions-league"
        className="inline-flex items-center gap-1.5 hover:underline"
      >
        <img
          src={leagueLogoUrl("CL")}
          alt=""
          className="h-3.5 w-3.5 rounded-sm bg-white/90 object-contain p-px"
        />
        Champions League
        {place !== null && (
          <span className="opacity-70">
            · <span className="font-value">{ordinal(place)}</span> in league phase
          </span>
        )}
      </Link>
    </SignalBadge>
  );
}
