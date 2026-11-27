"use client";

import { useMemo, useState } from "react";
import { ClubCell } from "@/components/ClubCell";
import { Combobox, type ComboboxGroup } from "@/components/Combobox";
import { LeagueBadge } from "@/components/LeagueBadge";
import { Card, CardContent } from "@/components/ui/card";
import {
  SortableHeader,
  SortPicker,
  useTableSort,
  type SortColumn,
} from "@/components/SortableTable";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatMarketValue, formatValuePerPlayer } from "@/lib/format";
import { LEAGUES } from "@/lib/leagues";
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

const ALL = "all";
const TOP_5 = "top5";
const TOP_5_CODES: string[] = LEAGUES.map((l) => l.code);

/** TM's competition codes lead with the country ("BRA1", "AR1N", "QSL"). These are the
 *  ones outside Europe a hundred-richest squad could come from; the rest are UEFA. */
const OUTSIDE_UEFA: Record<string, string> = {
  BRA: "CONMEBOL",
  AR: "CONMEBOL",
  MLS: "CONCACAF",
  MEX: "CONCACAF",
  SA: "AFC",
  QSL: "AFC",
  UAE: "AFC",
  JAP: "AFC",
  CSL: "AFC",
};
const confederationOf = (code: string) => OUTSIDE_UEFA[code.replace(/\d.*$/, "")] ?? "UEFA";

const inLeague = (club: SquadValueClub, league: string) =>
  league === ALL ||
  (league === TOP_5 ? TOP_5_CODES.includes(club.leagueCode) : club.leagueCode === league);

/** All, the top five when any is in scope, then each league by how many clubs it has here.
 *  Keyed by code: Russia's and Ukraine's are both "Premier Liga", so a shared name gets it. */
function leagueGroups(clubs: SquadValueClub[]): ComboboxGroup[] {
  const leagues = new Map<string, { name: string; count: number }>();
  for (const c of clubs) {
    const l = leagues.get(c.leagueCode) ?? { name: c.league, count: 0 };
    leagues.set(c.leagueCode, { ...l, count: l.count + 1 });
  }
  const byCount = [...leagues].sort(([, a], [, b]) => b.count - a.count);
  const shared = (name: string) => byCount.filter(([, l]) => l.name === name).length > 1;
  return [
    {
      options: [
        { value: ALL, label: "All leagues" },
        ...(byCount.some(([code]) => TOP_5_CODES.includes(code))
          ? [{ value: TOP_5, label: "Top 5 leagues" }]
          : []),
      ],
    },
    {
      options: byCount.map(([code, { name }]) => ({
        value: code,
        label: shared(name) ? `${name} (${code})` : name,
      })),
    },
  ];
}

/**
 * The hundred most valuable squads in world football, sortable on every figure
 * Transfermarkt publishes for them.
 *
 * Value per player leads because it is the column the total-value ranking hides:
 * a 24-man squad and a 33-man one reach the same total on very different money
 * per head. Narrowed by confederation and league, the position counts within what's on
 * screen. The table needs more width than a phone has, so below `md` the rows
 * become cards and the header's sort buttons become a picker.
 */
export function SquadValuesTable({ clubs }: { clubs: SquadValueClub[] }) {
  const [confederation, setConfederation] = useState(ALL);
  const [league, setLeague] = useState(ALL);

  // In the order each one's richest club appears.
  const confederations = useMemo(
    () => [...new Set(clubs.map((c) => confederationOf(c.leagueCode)))],
    [clubs],
  );
  const inConfederation = useMemo(
    () =>
      confederation === ALL
        ? clubs
        : clubs.filter((c) => confederationOf(c.leagueCode) === confederation),
    [clubs, confederation],
  );
  const leagues = useMemo(() => leagueGroups(inConfederation), [inConfederation]);
  const scoped = useMemo(
    () => inConfederation.filter((c) => inLeague(c, league)),
    [inConfederation, league],
  );
  const { sort, rows, toggle, pick, flip } = useTableSort(scoped, COLUMNS, "averageValue");

  return (
    <div className="space-y-3">
      <p className="max-w-3xl text-sm text-text-muted">
        <span className="font-value">{clubs.length}</span> clubs, the ones Transfermarkt ranks
        highest by squad value — sorting another column re-orders that set rather than re-picking
        it. Value per player = squad value ÷ squad size. Top 18 share = top 18 value ÷ squad value.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={confederation}
          // Clicking the chip that's already on hands back "", which means every club.
          onValueChange={(v) => {
            setConfederation(v || ALL);
            setLeague(ALL);
          }}
          aria-label="Confederation"
          className="flex-wrap"
        >
          {[ALL, ...confederations].map((c) => (
            <ToggleGroupItem key={c} value={c} className="rounded-lg">
              {c === ALL ? "All" : c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Combobox
          value={league}
          onChange={(v) => setLeague(v || ALL)}
          groups={leagues}
          placeholder="All leagues"
          searchPlaceholder="Search leagues..."
        />
      </div>

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
