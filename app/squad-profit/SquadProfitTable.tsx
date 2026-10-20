import { ClubCell } from "@/components/ClubCell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TONE_TEXT, gainTone } from "@/lib/fee-vs-value-rankings";
import { formatMarketValue, formatPremium } from "@/lib/format";
import type { SquadProfitClub } from "@/lib/squad-profit";
import { cn } from "@/lib/utils";

const formatPct = (pct: number) => `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;

/** One end of the table, biggest move first. Starred rows are the Pareto
 *  frontier: each moved its squad by a bigger share than every club above it.
 *  Phones keep the move with its share under it; the two values behind it show from sm. */
export function SquadProfitTable({ title, clubs }: { title: string; clubs: SquadProfitClub[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-pixel text-lg font-bold text-text-primary sm:text-xl">{title}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-right">#</TableHead>
            <TableHead>Club</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Worth now</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Paid</TableHead>
            <TableHead className="text-right">Difference</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Share</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club, i) => {
            const tone = TONE_TEXT[gainTone(club.diff)];
            return (
              <TableRow key={club.id} className={club.star ? "bg-accent-gold/10" : ""}>
                <TableCell className="font-value text-right text-text-muted">{i + 1}</TableCell>
                <TableCell className="w-full max-w-0 sm:w-auto sm:max-w-none">
                  <ClubCell id={club.id} name={club.name}>
                    {club.star && <Badge className="shrink-0">★</Badge>}
                  </ClubCell>
                  <p className="truncate pl-7 text-xs text-text-muted">{club.league}</p>
                </TableCell>
                <TableCell className="font-value hidden text-right sm:table-cell">
                  {formatMarketValue(club.marketValue)}
                </TableCell>
                <TableCell className="font-value hidden text-right sm:table-cell">
                  {formatMarketValue(club.purchaseValue)}
                </TableCell>
                <TableCell className={cn("font-value text-right", tone)}>
                  {formatPremium(club.diff)}
                  <p className="text-xs sm:hidden">{formatPct(club.pct)}</p>
                </TableCell>
                <TableCell className={cn("font-value hidden text-right sm:table-cell", tone)}>
                  {formatPct(club.pct)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
