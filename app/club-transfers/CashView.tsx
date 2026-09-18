"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SectionPanel } from "@/components/SectionPanel";
import { formatMillions, getTeamDetailHref } from "@/lib/format";
import type { TransferBalanceMetric, TransferBalanceWindow } from "@/app/types";
import { BalanceTable } from "./BalanceTable";
import { LeaderCard, type Leader } from "./Overview";

const CASH_LABEL: Record<TransferBalanceMetric, string> = {
  expenditure: "Gross spend",
  income: "Sales",
  netSpender: "Biggest net spender",
  netProfit: "Biggest net profit",
};
const CASH_ORDER: TransferBalanceMetric[] = ["expenditure", "income", "netSpender", "netProfit"];

function cashLeaders(cash: TransferBalanceWindow): Leader[] {
  const club = (id: string) => cash.clubs.find((c) => c.id === id);
  return CASH_ORDER.map((metric) => {
    const l = cash.leaders[metric];
    const c = club(l.id);
    const sub =
      metric === "expenditure"
        ? c
          ? `${c.arrivals} signings`
          : ""
        : metric === "income"
          ? c
            ? `${c.departures} departures`
            : ""
          : metric === "netSpender"
            ? "spent minus banked"
            : "banked minus spent";
    return {
      label: CASH_LABEL[metric],
      clubId: l.id,
      name: c?.name ?? l.name,
      figure: formatMillions(l.value),
      tone: metric === "netSpender" ? "over" : metric === "netProfit" ? "under" : "neutral",
      sub,
    };
  });
}

/** Who tops two of the four cash measures at once — the balance page's own
 *  hook, kept. */
function MultiWinner({ cash }: { cash: TransferBalanceWindow }) {
  if (cash.winners.length === 0) {
    return (
      <p className="text-xs text-text-muted">
        No club tops two of the four over this window — widen it to find one.
      </p>
    );
  }
  return (
    <Card className="border-accent-gold bg-accent-gold/5">
      <CardContent className="p-3 sm:p-4">
        {cash.winners.map((w) => (
          <p key={w.id} className="text-sm">
            <Link href={getTeamDetailHref(w.id)} className="font-bold hover:underline">
              {w.name}
            </Link>{" "}
            tops <span className="font-value">{w.metrics.length}</span> of{" "}
            <span className="font-value">4</span> —{" "}
            {w.metrics.map((m) => CASH_LABEL[m]).join(" + ")}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * How many seasons the window spans. It heads the tab because it rewrites
 * everything under it — the four cards, the winner and the table — and a
 * control that sits beside the thing it changes needs no explaining. One
 * hairline box of flush segments, as the site draws a segmented control; on a
 * phone the segments share the row at a thumb's height.
 */
function SeasonsControl({
  windows,
  cash,
  onSeasons,
}: {
  windows: TransferBalanceWindow[];
  cash: TransferBalanceWindow;
  onSeasons: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5 sm:shrink-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Seasons</span>
        <span className="font-value text-xs text-text-muted">{cash.label}</span>
      </div>
      <ToggleGroup
        type="single"
        value={String(cash.seasons)}
        onValueChange={(v) => v && onSeasons(Number(v))}
        className="w-full gap-0 divide-x divide-border-subtle overflow-hidden rounded-lg border border-border-subtle sm:w-auto"
        aria-label="Seasons"
      >
        {windows.map((w) => (
          <ToggleGroupItem
            key={w.seasons}
            value={String(w.seasons)}
            className="h-10 flex-1 rounded-none px-3 sm:h-9 sm:flex-none sm:px-4"
          >
            <span className="font-value">{w.seasons}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/**
 * The Spend & sales tab: every deal Transfermarkt lists, in cash, for the
 * world's biggest buyers and sellers. One window of it at a time — the seasons
 * control at the top picks which, and the cards, the winner and the table
 * under it all read from the same window.
 */
export function CashView({
  windows,
  cash,
  onSeasons,
}: {
  windows: TransferBalanceWindow[];
  cash: TransferBalanceWindow;
  onSeasons: (n: number) => void;
}) {
  const leaders = useMemo(() => cashLeaders(cash), [cash]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className="text-base font-pixel font-bold text-text-primary sm:text-lg">
            The money, one to four seasons
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Every deal Transfermarkt lists, in cash — the world&apos;s biggest buyers and sellers
            over windows ending with the current season.
          </p>
        </div>
        <SeasonsControl windows={windows} cash={cash} onSeasons={onSeasons} />
      </div>

      <SectionPanel title="Biggest money">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {leaders.map((l) => (
            <LeaderCard key={l.label} l={l} />
          ))}
        </div>
        <div className="mt-3">
          <MultiWinner cash={cash} />
        </div>
      </SectionPanel>

      <SectionPanel
        title="Every club"
        aside={
          <span className="text-xs text-text-muted">
            <span className="font-value">{cash.clubs.length}</span> clubs
          </span>
        }
      >
        <BalanceTable window={cash} />
        <p className="mt-3 text-xs text-text-muted">
          Positions reach the top <span className="font-value">25</span> clubs on each measure. A
          starred club tops two or more of the four at once.
        </p>
      </SectionPanel>
    </div>
  );
}
