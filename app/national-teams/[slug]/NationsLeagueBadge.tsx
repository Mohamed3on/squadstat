import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ordinal } from "@/lib/format";
import { getNationsSeason } from "@/lib/uefa/fetch";
import { COMPETITIONS, compHref } from "@/lib/uefa/types";

const CODES = ["UNLA", "UNLB"] as const;

/**
 * A nation's Nations League group and place, for the 32 in Leagues A and B; the
 * rest get nothing. Same shape as the club page's `CompetitionBadge`: own fetch,
 * own `<Suspense>`, failure swallowed rather than taken out on the page around it.
 */
export async function NationsLeagueBadge({ teamId }: { teamId: string }) {
  const seasons = await Promise.all(CODES.map((c) => getNationsSeason(c).catch(() => null)));
  const i = seasons.findIndex((s) => s?.table.some((r) => r.id === teamId));
  if (i < 0) return null;

  const comp = COMPETITIONS[CODES[i]];
  const table = seasons[i]!.table;
  const row = table.find((r) => r.id === teamId)!;
  // Transfermarkt's row order, which has applied the tie-breaks its rank leaves level.
  const place =
    table
      .filter((r) => r.group === row.group)
      .sort((a, b) => a.order - b.order)
      .findIndex((r) => r.id === teamId) + 1;

  return (
    <Link href={compHref(comp)}>
      <Badge variant="secondary" className="transition-opacity hover:opacity-80">
        {comp.name} · {row.pl > 0 ? `${ordinal(place)} in ` : ""}Group {row.group}
      </Badge>
    </Link>
  );
}
