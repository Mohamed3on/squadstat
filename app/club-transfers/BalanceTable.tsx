"use client";

import { ClubCell } from "@/components/ClubCell";
import {
  SortableHeader,
  SortPicker,
  useTableSort,
  type SortColumn,
} from "@/components/SortableTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { TONE_TEXT, gainTone } from "@/lib/fee-vs-value-rankings";
import { formatMillions } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransferBalanceClub, TransferBalanceWindow } from "@/app/types";

type SortKey = "name" | "expenditure" | "arrivals" | "income" | "departures" | "balance";

/** Module-level, as `useTableSort` requires: an inline array re-sorts every render. */
const COLUMNS: SortColumn<TransferBalanceClub, SortKey>[] = [
  { key: "name", label: "Club", value: (c) => c.name },
  { key: "expenditure", label: "Gross spend", numeric: true, value: (c) => c.expenditure },
  { key: "arrivals", label: "Signings", numeric: true, value: (c) => c.arrivals },
  { key: "income", label: "Sales", numeric: true, value: (c) => c.income },
  { key: "departures", label: "Departures", numeric: true, value: (c) => c.departures },
  { key: "balance", label: "Net", numeric: true, value: (c) => c.balance },
];

/** Down on transfers is red, up is green — the site's one colour rule, read
 *  off the balance's sign: positive means the club banked money. */
const netTone = (value: number) => TONE_TEXT[gainTone(value)];

/**
 * Every deal Transfermarkt lists, in cash, for the world's biggest buyers and
 * sellers — one window of it, chosen by the seasons control up in the overview.
 *
 * The table needs 604px and only fits from md up; below that it hid the Net
 * column entirely behind a horizontal scroll, so phones get cards instead.
 */
export function BalanceTable({ window }: { window: TransferBalanceWindow }) {
  const { sort, rows, toggle, pick, flip } = useTableSort(window.clubs, COLUMNS, "expenditure");
  const isMulti = (id: string) => (window.wins[id] ?? []).length >= 2;

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        <span className="font-value">{window.label}</span> ·{" "}
        <span className="font-value">{window.clubs.length}</span> clubs
      </p>

      <div className="space-y-3 md:hidden">
        <SortPicker
          columns={COLUMNS}
          sort={sort}
          onPick={pick}
          onFlip={flip}
          label="Sort clubs by"
        />

        {rows.map((club) => (
          <Card key={club.id} className={isMulti(club.id) ? "border-accent-gold" : ""}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <ClubCell id={club.id} name={club.name}>
                  {isMulti(club.id) && <Badge className="shrink-0">★</Badge>}
                </ClubCell>
                <div className="shrink-0 text-right">
                  <p className="text-xs tracking-wide text-text-muted uppercase">Net</p>
                  <p className={cn("font-value text-sm", netTone(club.balance))}>
                    {formatMillions(club.balance)}
                  </p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-border-subtle pt-2 text-xs">
                <div>
                  <dt className="text-text-muted">Gross spend</dt>
                  <dd className="font-value">
                    {formatMillions(club.expenditure)}{" "}
                    <span className="text-text-muted">({club.arrivals} in)</span>
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="text-text-muted">Sales</dt>
                  <dd className="font-value">
                    {formatMillions(club.income)}{" "}
                    <span className="text-text-muted">({club.departures} out)</span>
                  </dd>
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
            {rows.map((club) => (
              <TableRow key={club.id} className={isMulti(club.id) ? "bg-accent-gold/10" : ""}>
                <TableCell>
                  <ClubCell id={club.id} name={club.name}>
                    {isMulti(club.id) && <Badge className="shrink-0">★</Badge>}
                  </ClubCell>
                </TableCell>
                <TableCell className="font-value text-right">
                  {formatMillions(club.expenditure)}
                </TableCell>
                <TableCell className="font-value text-right">{club.arrivals}</TableCell>
                <TableCell className="font-value text-right">
                  {formatMillions(club.income)}
                </TableCell>
                <TableCell className="font-value text-right">{club.departures}</TableCell>
                <TableCell className={cn("font-value text-right", netTone(club.balance))}>
                  {formatMillions(club.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
