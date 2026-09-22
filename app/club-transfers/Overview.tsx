"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SectionPanel } from "@/components/SectionPanel";
import { TOP_TRANSFER_LIMIT } from "@/lib/constants";
import type { ClubWindow } from "@/lib/fee-vs-value";
import {
  CLUB_MODES,
  TONE_TEXT,
  rankClubs,
  seasonLabel,
  surplus,
  windowSentence,
  type ModeSpec,
  type Tone,
} from "@/lib/fee-vs-value-rankings";
import { formatMarketValue, getTeamDetailHref } from "@/lib/format";
import { crestUrl } from "@/lib/transfermarkt/image";
import { cn } from "@/lib/utils";

const money = formatMarketValue;
const { buying, selling, "squad-value": squadValue, overall } = CLUB_MODES;

/**
 * The overall verdict with the squad's direction as a condition on top: a good
 * window *and* a stronger squad, a bad window *and* a weaker one. Not a ranking
 * of its own — the order is the overall one — just the two cards that name the
 * double, so a club that had the best window by selling everyone (PSG) sits
 * beside one that had a good window by getting better for less (Como).
 */
const STRONGER: ModeSpec = {
  ...overall,
  ends: [
    {
      title: "Good window, stronger squad",
      tone: "under",
      side: "in",
      qualifies: (c) => surplus(c) > 0 && c.netValue > 0,
    },
    {
      title: "Bad window, weaker squad",
      tone: "over",
      side: "out",
      qualifies: (c) => surplus(c) < 0 && c.netValue < 0,
    },
  ],
};

/** The five cards of each business row: the end of each ranking, in the order
 *  the ledger's columns run, then the double. */
const BEST: [ModeSpec, 0 | 1][] = [
  [buying, 1],
  [selling, 0],
  [squadValue, 0],
  [overall, 0],
  [STRONGER, 0],
];
const WORST: [ModeSpec, 0 | 1][] = [
  [buying, 0],
  [selling, 1],
  [squadValue, 1],
  [overall, 1],
  [STRONGER, 1],
];

/** The sentence under a card's figure — what the club actually did. */
function sentence(mode: ModeSpec, c: ClubWindow): string {
  if (mode === buying) return `${money(c.in.marketValue)} of players for ${money(c.in.fees)}`;
  if (mode === selling) return `${money(c.out.marketValue)} of players for ${money(c.out.fees)}`;
  if (mode === squadValue) return `${money(c.in.marketValue)} in · ${money(c.out.marketValue)} out`;
  return windowSentence(c);
}

export interface Leader {
  label: string;
  clubId: string;
  name: string;
  logoUrl?: string;
  figure: string;
  tone: Tone;
  sub: string;
  /** The ranking this card heads, for a variant that can open it. The double
   *  opens the overall ranking, which is the order it was read in. */
  opens?: [ModeSpec, 0 | 1];
}

function leaderOf(rows: ClubWindow[], [mode, endIndex]: [ModeSpec, 0 | 1]): Leader | null {
  const c = rankClubs(rows, mode, endIndex)[0];
  if (!c) return null;
  return {
    label: mode.ends[endIndex].title,
    clubId: c.club.clubId,
    name: c.club.name,
    logoUrl: c.club.logoUrl,
    figure: mode.figure(c),
    tone: mode.ends[endIndex].tone,
    sub: sentence(mode, c),
    opens: [mode === STRONGER ? overall : mode, endIndex],
  };
}

/** A row of cards, one per ranking. The double is the overall ranking narrowed,
 *  so when the overall leader already qualifies for it both cards name the same
 *  club with the same figure — Man City, twice, in 2026/27's worst row. Two
 *  cards that open the same ranking at the same club are one fact, said once. */
function leadersOf(rows: ClubWindow[], ends: [ModeSpec, 0 | 1][]): Leader[] {
  const cards = ends.flatMap((e) => leaderOf(rows, e) ?? []);
  return cards.filter(
    (l, i) =>
      !cards.slice(0, i).some((p) => p.clubId === l.clubId && p.opens?.[0] === l.opens?.[0]),
  );
}

/** One club at the top of one measure: the measure, the club, the figure, and
 *  what it did. Shared by the value cards here and the cash cards in the
 *  Spend & sales tab. */
export function LeaderCard({
  l,
  onPick,
}: {
  l: Leader;
  onPick?: (mode: ModeSpec, endIndex: 0 | 1) => void;
}) {
  const label = `${l.label}`;
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        {l.opens && onPick ? (
          // The label opens the ranking this club heads.
          <button
            type="button"
            onClick={() => onPick(...l.opens!)}
            className="mb-2 block cursor-pointer text-left text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary"
          >
            {label} <span aria-hidden>↓</span>
          </button>
        ) : (
          <p className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
        )}
        <div className="mb-1 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.logoUrl ?? crestUrl(l.clubId)}
            alt=""
            loading="lazy"
            className="size-5 shrink-0 object-contain"
          />
          <Link
            href={getTeamDetailHref(l.clubId)}
            className="truncate text-sm font-bold hover:underline"
          >
            {l.name}
          </Link>
        </div>
        <p className={cn("font-value text-lg", TONE_TEXT[l.tone])}>{l.figure}</p>
        {l.sub && <p className="mt-0.5 font-value text-xs text-text-muted">{l.sub}</p>}
      </CardContent>
    </Card>
  );
}

/** The fifth card takes the whole row on a phone rather than sitting alone in
 *  a half-width slot. A row of four — the double said once — lets its last card
 *  take the empty fifth column on desktop instead. */
const FIVE_ACROSS =
  "grid grid-cols-2 gap-3 lg:grid-cols-5 [&>:nth-child(5)]:col-span-2 lg:[&>:nth-child(5)]:col-span-1 lg:[&>:nth-child(4):last-child]:col-span-2";

/**
 * The top of the value judgement: the best business, then the worst.
 *
 * Both rows read the whole window, loans counted — the same cut the club-page
 * badges quote, so a club badged "Bought best" is the club on the card. The
 * money in cash is the other tab's business and never appears here.
 */
export function Overview({
  rows,
  season,
  onPick,
}: {
  /** Every club window, loans in, unfiltered. */
  rows: ClubWindow[];
  season: number;
  onPick: (mode: ModeSpec, endIndex: 0 | 1) => void;
}) {
  const best = useMemo(() => leadersOf(rows, BEST), [rows]);
  const worst = useMemo(() => leadersOf(rows, WORST), [rows]);

  return (
    <div className="space-y-6">
      <SectionPanel
        title="Best business"
        aside={
          <span className="text-xs text-text-muted">
            the <span className="font-value">{TOP_TRANSFER_LIMIT}</span> biggest deals of{" "}
            <span className="font-value">{seasonLabel(season)}</span>
          </span>
        }
      >
        <div className={FIVE_ACROSS}>
          {best.map((l) => (
            <LeaderCard key={l.label} l={l} onPick={onPick} />
          ))}
        </div>
      </SectionPanel>

      <SectionPanel title="Worst business">
        <div className={FIVE_ACROSS}>
          {worst.map((l) => (
            <LeaderCard key={l.label} l={l} onPick={onPick} />
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
