"use client";

import { useMemo, useRef } from "react";
import { Combobox } from "@/components/Combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TOP_TRANSFER_LIMIT } from "@/lib/constants";
import { buildClubWindows, type PricedTransfer } from "@/lib/fee-vs-value";
import {
  CLUB_MODES,
  CLUB_PATH,
  endKeyOf,
  inLeague,
  leagueGroups,
  resolveClubs,
  seasonLabel,
  type ModeSpec,
} from "@/lib/fee-vs-value-rankings";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { canonicalLeagueName } from "@/lib/leagues";
import { cn } from "@/lib/utils";
import type { TransferBalanceResult } from "@/app/types";
import { CashView } from "./CashView";
import { ClubLedger, ledgerBlurb, ledgerTitle, type LedgerSort } from "./ClubLedger";
import { Overview } from "./Overview";

const MODES = Object.values(CLUB_MODES) as ModeSpec[];

/** The page's two questions, as the rail names them. Value is the default and
 *  keeps the URL clean; only the cash tab is spelt out. */
type Tab = "value" | "cash";

/**
 * The club page, in two tabs: the window judged by value — the top of every
 * category, then every club as a row — and the same clubs' business in cash.
 *
 * Everything that picks a view lives in the URL — the tab, which ranking leads
 * the ledger, which end of it, the league, and how many seasons the cash spans
 * — so any view can be linked and a club's badge lands on the exact table it
 * heads. The two tabs share nothing but the page: the seasons control rewrites
 * only the cash tab, and the league filter only the ledger.
 */
export function ClubTransfersUI({
  transfers,
  balance,
  season,
}: {
  transfers: PricedTransfer[];
  balance: TransferBalanceResult;
  season: number;
}) {
  const { params, replace } = useQueryParams(CLUB_PATH);
  const tab: Tab = params.get("tab") === "cash" ? "cash" : "value";
  const by = params.get("by");
  const { mode, endKey, endIndex } = resolveClubs(by, params.get("end"));
  const sort: LedgerSort = by === "net" ? { net: endKey } : { mode, endIndex };
  const league = canonicalLeagueName(params.get("league") || "all");

  const seasons = Number(params.get("seasons"));
  const cash = balance.windows.find((w) => w.seasons === seasons) ?? balance.windows[0];

  // One set of windows for both, narrowed to the chosen league by club rather
  // than by move: narrowing the moves first would restate each club's window as
  // "the part of it that touched this league" and print it under the same
  // heading.
  const all = useMemo(() => buildClubWindows(transfers), [transfers]);
  const rows = useMemo(() => all.filter((c) => inLeague(c.club.league, league)), [all, league]);
  const leagues = useMemo(() => leagueGroups(transfers), [transfers]);

  const show = (m: ModeSpec, i: 0 | 1) => replace({ by: m.slug, end: endKeyOf(m, i) });

  // A card's label opens its ranking, which is further down the page than the
  // click — go there too, or the click reads as having done nothing.
  const ledgerRef = useRef<HTMLElement>(null);
  const openLedger = (m: ModeSpec, i: 0 | 1) => {
    show(m, i);
    ledgerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The rail sticks under the header, so a tab can be switched from anywhere
  // in a long ledger. A switch from deep in one tab would otherwise leave the
  // reader partway down the other, so it also returns to the top of the rail.
  const rootRef = useRef<HTMLDivElement>(null);
  const switchTab = (next: string) => {
    replace({ tab: next === "cash" ? "cash" : null });
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
  };

  return (
    <Tabs ref={rootRef} value={tab} onValueChange={switchTab} className="scroll-mt-14">
      <div className="sticky top-14 z-40 -mx-3 border-b border-border-subtle bg-black/90 px-3 py-2 backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="value" className="flex-1 sm:flex-none">
            Fee vs worth
          </TabsTrigger>
          <TabsTrigger value="cash" className="flex-1 sm:flex-none">
            Spend &amp; sales
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="value" className="mt-6 space-y-8 sm:mt-8 sm:space-y-10">
        <Overview rows={all} season={season} onPick={openLedger} />

        <section ref={ledgerRef} className="scroll-mt-32 space-y-4">
          {/* No "rank by" control beside this: the table's own column headers are
              the eight questions, each one clicked once for its best end and
              again for its worst, and the heading below says which is showing.
              The phone view has no headers to click, so it keeps a picker of its
              own inside the card list. */}
          <div className="min-w-0">
            <h2 className="text-base font-pixel font-bold text-text-primary sm:text-lg">
              {ledgerTitle(sort)}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{ledgerBlurb(sort)}</p>
          </div>

          {/* Whose business to show. It lives in the URL like every other choice
              here, so a filtered view can be linked. */}
          <div className="flex flex-wrap items-center gap-2">
            <Combobox
              value={league}
              onChange={(v) => replace({ league: v === "all" ? null : v || null })}
              groups={leagues}
              placeholder="All leagues"
              searchPlaceholder="Search leagues..."
            />
          </div>

          <ClubLedger
            rows={rows}
            sort={sort}
            onSort={(key, end) => {
              if (key === "net") replace({ by: "net", end });
              else {
                const m = MODES.find((x) => x.slug === key)!;
                replace({ by: m.slug, end });
              }
            }}
          />

          <p className={cn("text-xs text-text-muted")}>
            Only the <span className="font-value">{TOP_TRANSFER_LIMIT}</span> biggest transfers of{" "}
            <span className="font-value">{seasonLabel(season)}</span>, each fee held against what
            the player is worth today. <strong>Bought</strong> and <strong>Sold</strong> are fee
            minus worth — green is the good outcome from either end, under value on the way in and
            over it on the way out. <strong>Overall</strong> is value added minus net spend,
            everything netted — a club can have a good window while getting weaker if the market
            paid it enough on the way. Loans count towards <strong>Squad value</strong>, where a
            player on loan is in the dressing room either way, and a loan fee counts as cash in{" "}
            <strong>Net</strong>. What they stay out of is <strong>Bought</strong> and{" "}
            <strong>Sold</strong>: TM publishes a fee for few loans, and neither a €3m loan fee nor
            no fee at all is what a €25m player was worth. A club keeps its whole window under any
            league filter; open a row for the deals behind it.
          </p>
        </section>
      </TabsContent>

      <TabsContent value="cash" className="mt-6 sm:mt-8">
        <CashView
          windows={balance.windows}
          cash={cash}
          onSeasons={(n) =>
            replace({ seasons: n === balance.windows[0].seasons ? null : String(n) })
          }
        />
      </TabsContent>
    </Tabs>
  );
}
