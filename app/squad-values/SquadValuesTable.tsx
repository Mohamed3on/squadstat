"use client";

import { ClubCell } from "@/components/ClubCell";
import { LeagueBadge } from "@/components/LeagueBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
  SortableHeader,
  SortPicker,
  useTableSort,
  type SortColumn,
} from "@/components/SortableTable";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { formatMarketValue, formatValuePerPlayer } from "@/lib/format";
import type { SquadValueClub } from "@/app/types";

type SortKey =
  | "position"
  | "name"
  | "league"
  | "squadSize"
  | "averageAge"
  | "totalValue"
  | "averageValue"
  | "topEighteenValue"
  | "topEighteenShare";

/** Module-level, as `useTableSort` requires: an inline array re-sorts every render. */
const COLUMNS: SortColumn<SquadValueClub, SortKey>[] = [
  // No `value`: the position is where a club sits in whatever sort is on screen,
  // so it has nothing of its own to sort by.
  { key: "position", label: "#" },
  { key: "name", label: "Club", value: (c) => c.name },
  { key: "league", label: "League", value: (c) => c.league },
  { key: "squadSize", label: "Squad size", numeric: true, value: (c) => c.squadSize },
  { key: "averageAge", label: "Avg age", numeric: true, value: (c) => c.averageAge },
  { key: "totalValue", label: "Squad value", numeric: true, value: (c) => c.totalValue },
  { key: "averageValue", label: "Value per player", numeric: true, value: (c) => c.averageValue },
  {
    key: "topEighteenValue",
    label: "Top 18 value",
    numeric: true,
    value: (c) => c.topEighteenValue,
  },
  {
    key: "topEighteenShare",
    label: "Top 18 share",
    numeric: true,
    value: (c) => c.topEighteenShare,
  },
];

const share = (percent: number) => `${percent.toFixed(1)}%`;

/**
 * The hundred most valuable squads in world football, sortable on every figure
 * Transfermarkt publishes for them.
 *
 * Value per player leads because it is the column the total-value ranking hides:
 * a 24-man squad and a 33-man one reach the same total on very different money
 * per head. The table needs more width than a phone has, so below `md` the rows
 * become cards and the header's sort buttons become a picker.
 */
export function SquadValuesTable({ clubs }: { clubs: SquadValueClub[] }) {
  const { sort, rows, toggle, pick, flip } = useTableSort(clubs, COLUMNS, "averageValue");

  return (
    <div className="space-y-3">
      <p className="max-w-3xl text-sm text-text-muted">
        <span className="font-value">{clubs.length}</span> clubs, the ones Transfermarkt ranks
        highest by squad value — sorting another column re-orders that set rather than re-picking
        it. Value per player = squad value ÷ squad size. Top 18 share = top 18 value ÷ squad value.
      </p>

      <div className="space-y-3 md:hidden">
        <SortPicker
          columns={COLUMNS}
          sort={sort}
          onPick={pick}
          onFlip={flip}
          label="Sort clubs by"
        />

        {rows.map((club, i) => (
          <Card key={club.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <ClubCell id={club.id} name={club.name} />
                  <LeagueBadge league={club.league} code={club.leagueCode} />
                </div>
                <span className="font-value shrink-0 text-sm text-text-muted">#{i + 1}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-subtle pt-2 text-xs">
                <div>
                  <dt className="text-text-muted">Squad value</dt>
                  <dd className="font-value">
                    {formatMarketValue(club.totalValue)}{" "}
                    <span className="text-text-muted">({club.squadSize} players)</span>
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="text-text-muted">Value per player</dt>
                  <dd className="font-value text-accent-gold">
                    {formatValuePerPlayer(club.averageValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Top 18</dt>
                  <dd className="font-value">
                    {formatMarketValue(club.topEighteenValue)}{" "}
                    <span className="text-text-muted">({share(club.topEighteenShare)})</span>
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="text-text-muted">Avg age</dt>
                  <dd className="font-value">{club.averageAge.toFixed(1)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <SortableHeader columns={COLUMNS} sort={sort} onToggle={toggle} />
          <TableBody>
            {rows.map((club, i) => (
              <TableRow key={club.id}>
                <TableCell className="font-value text-text-muted">{i + 1}</TableCell>
                <TableCell>
                  <ClubCell id={club.id} name={club.name} />
                </TableCell>
                <TableCell>
                  <LeagueBadge league={club.league} code={club.leagueCode} />
                </TableCell>
                <TableCell className="font-value text-right">{club.squadSize}</TableCell>
                <TableCell className="font-value text-right">
                  {club.averageAge.toFixed(1)}
                </TableCell>
                <TableCell className="font-value text-right">
                  {formatMarketValue(club.totalValue)}
                </TableCell>
                <TableCell className="font-value text-right text-accent-gold">
                  {formatValuePerPlayer(club.averageValue)}
                </TableCell>
                <TableCell className="font-value text-right">
                  {formatMarketValue(club.topEighteenValue)}
                </TableCell>
                <TableCell className="font-value text-right">
                  {share(club.topEighteenShare)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
