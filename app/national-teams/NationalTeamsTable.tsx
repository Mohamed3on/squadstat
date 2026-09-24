"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyNote } from "@/components/EmptyNote";
import { NationalityFlag } from "@/components/NationalityFlag";
import {
  SortableHeader,
  SortPicker,
  useTableSort,
  type SortColumn,
} from "@/components/SortableTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatMarketValue, formatValuePerPlayer } from "@/lib/format";
import { normalizeForSearch } from "@/lib/normalize";
import { flagUrl } from "@/lib/transfermarkt/image";
import type { NationalTeamValue } from "@/app/types";

type SortKey =
  | "position"
  | "name"
  | "confederation"
  | "squadSize"
  | "averageAge"
  | "totalValue"
  | "averageValue";

/** Module-level, as `useTableSort` requires: an inline array re-sorts every render. */
const COLUMNS: SortColumn<NationalTeamValue, SortKey>[] = [
  // No `value`: the position is where a nation sits in whatever sort is on screen,
  // so it has nothing of its own to sort by.
  { key: "position", label: "#" },
  { key: "name", label: "Country", value: (t) => t.name },
  { key: "confederation", label: "Confederation", value: (t) => t.confederation },
  { key: "squadSize", label: "Squad size", numeric: true, value: (t) => t.squadSize },
  { key: "averageAge", label: "Avg age", numeric: true, value: (t) => t.averageAge },
  { key: "totalValue", label: "Squad value", numeric: true, value: (t) => t.totalValue },
  { key: "averageValue", label: "Value per player", numeric: true, value: (t) => t.averageValue },
];

const ALL = "all";

/** Flag and name, linked to the nation's players when the site tracks any. */
function NationCell({ team, href }: { team: NationalTeamValue; href?: string }) {
  return (
    <div className="flex items-center gap-2">
      <NationalityFlag url={flagUrl(String(team.landId))} />
      {href ? (
        <Link href={href} className="truncate text-sm font-bold hover:underline">
          {team.name}
        </Link>
      ) : (
        <span className="truncate text-sm font-bold">{team.name}</span>
      )}
    </div>
  );
}

/**
 * The hundred most valuable national teams, sortable on every figure
 * Transfermarkt publishes for them, searchable by name and narrowed by
 * confederation.
 *
 * The position counts within the confederation on screen, and a search only
 * hides rows — so a searched nation still shows where it stands. Below `md`
 * the rows become cards and the header's sort buttons become a picker.
 */
export function NationalTeamsTable({
  teams,
  playerLinks,
}: {
  teams: NationalTeamValue[];
  /** Nation name → its players on /players, for the nations the site tracks. */
  playerLinks: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [confederation, setConfederation] = useState(ALL);

  // In the order each one's richest nation appears in the hundred.
  const confederations = useMemo(() => [...new Set(teams.map((t) => t.confederation))], [teams]);
  const scoped = useMemo(
    () => (confederation === ALL ? teams : teams.filter((t) => t.confederation === confederation)),
    [teams, confederation],
  );
  const { sort, rows, toggle, pick, flip } = useTableSort(scoped, COLUMNS, "averageValue");

  const needle = normalizeForSearch(query);
  const shown = rows
    .map((team, i) => ({ team, rank: i + 1 }))
    .filter(({ team }) => normalizeForSearch(team.name).includes(needle));

  return (
    <div className="space-y-3">
      <p className="max-w-3xl text-sm text-text-muted">
        <span className="font-value">{teams.length}</span> national teams, the ones Transfermarkt
        ranks highest by squad value — sorting another column re-orders that set rather than
        re-picking it. Value per player = squad value ÷ squad size.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search countries"
          aria-label="Search countries"
          className="sm:max-w-xs"
        />
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={confederation}
          // Clicking the chip that's already on hands back "", which means everyone.
          onValueChange={(v) => setConfederation(v || ALL)}
          aria-label="Confederation"
          className="flex-wrap"
        >
          {[ALL, ...confederations].map((c) => (
            <ToggleGroupItem key={c} value={c} className="rounded-lg">
              {c === ALL ? "All" : c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="space-y-3 md:hidden">
        <SortPicker
          columns={COLUMNS}
          sort={sort}
          onPick={pick}
          onFlip={flip}
          label="Sort national teams by"
        />

        {shown.map(({ team, rank }) => (
          <Card key={team.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <NationCell team={team} href={playerLinks[team.name]} />
                  <Badge variant="secondary">{team.confederation}</Badge>
                </div>
                <span className="font-value shrink-0 text-sm text-text-muted">#{rank}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-subtle pt-2 text-xs">
                <div>
                  <dt className="text-text-muted">Squad value</dt>
                  <dd className="font-value">{formatMarketValue(team.totalValue)}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-text-muted">Value per player</dt>
                  <dd className="font-value text-accent-gold">
                    {formatValuePerPlayer(team.averageValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">Squad size</dt>
                  <dd className="font-value">{team.squadSize}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-text-muted">Avg age</dt>
                  <dd className="font-value">{team.averageAge.toFixed(1)}</dd>
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
            {shown.map(({ team, rank }) => (
              <TableRow key={team.id}>
                <TableCell className="font-value text-text-muted">{rank}</TableCell>
                <TableCell>
                  <NationCell team={team} href={playerLinks[team.name]} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{team.confederation}</Badge>
                </TableCell>
                <TableCell className="font-value text-right">{team.squadSize}</TableCell>
                <TableCell className="font-value text-right">
                  {team.averageAge.toFixed(1)}
                </TableCell>
                <TableCell className="font-value text-right">
                  {formatMarketValue(team.totalValue)}
                </TableCell>
                <TableCell className="font-value text-right text-accent-gold">
                  {formatValuePerPlayer(team.averageValue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {shown.length === 0 && (
        <EmptyNote>
          No {confederation === ALL ? "" : `${confederation} `}national team in the hundred matches
          “{query.trim()}”.
        </EmptyNote>
      )}
    </div>
  );
}
