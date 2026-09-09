import Link from "next/link";
import { InfoTip } from "@/app/components/InfoTip";
import { SignalBadge } from "@/components/SignalBadge";
import { formatMarketValue, formatValuePerPlayer, ordinal } from "@/lib/format";
import { SQUAD_VALUES_PATH, getSquadValuePlace } from "@/lib/squad-values";

/**
 * This club's place among the world's most valuable squads, if it has one.
 *
 * Nothing renders for a club outside Transfermarkt's hundred — most of them,
 * including plenty in the big five. The tip carries the scope, because "#4 most
 * valuable squad in the world" away from the table that says so is a claim
 * about every club there is, and the table only reaches a hundred deep.
 *
 * Same shape as `ClubWindowBadges`: own fetch, own `<Suspense>`, failure
 * swallowed rather than taken out on the page around it.
 */
export async function SquadValueBadge({ clubId }: { clubId: string }) {
  const place = await getSquadValuePlace(clubId).catch(() => null);
  if (!place) return null;

  const { club, rank, perPlayerRank, total } = place;

  return (
    <SignalBadge className="border-accent-gold/30 bg-accent-gold/10 text-accent-gold">
      <Link href={SQUAD_VALUES_PATH} className="hover:underline">
        <span className="font-value">#{rank}</span> most valuable squad in the world ·{" "}
        <span className="font-value">{formatMarketValue(club.totalValue)}</span>
      </Link>
      <InfoTip className="ml-1">
        <p>
          Transfermarkt&apos;s <span className="font-value">{total}</span> most valuable squads,
          ranked by total market value. Below that the table stops, so the place is exact rather
          than an estimate — but only down to <span className="font-value">{total}</span>.
        </p>
        <p className="mt-1.5">
          {club.name}&apos;s <span className="font-value">{club.squadSize}</span> players average{" "}
          <span className="font-value">{formatValuePerPlayer(club.averageValue)}</span> each,{" "}
          <span className="font-value">{ordinal(perPlayerRank)}</span> of the{" "}
          <span className="font-value">{total}</span>.
        </p>
      </InfoTip>
    </SignalBadge>
  );
}
