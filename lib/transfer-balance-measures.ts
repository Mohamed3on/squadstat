import type { TransferBalanceClub, TransferBalanceMetric } from "@/app/types";

/**
 * The four cash measures the Spend & sales tab ranks clubs on, and who leads
 * each — read by the tab's cards and table, a club's places on its own page and
 * the refresh's log alike.
 *
 * Who led was decided twice — the refresh committed the top row of each of
 * Transfermarkt's four sorted pages, and the club page placed clubs on its own
 * copy of these measures — and the four were named in three places. The two
 * disagreed on net spend: the committed leader carried TM's raw balance, so its
 * card read "−€238.4M" under "spent minus banked". The refresh now commits each
 * window's clubs and nothing else, and everything here is derived from them.
 *
 * Pure: the tab's cards and table are client components and the club page is a
 * server component, so this has to be safe in both bundles. The file read
 * lives in lib/transfer-balance.ts.
 */

export interface Measure {
  metric: TransferBalanceMetric;
  /** The plain noun a place reads with — "#3 net spend". */
  label: string;
  /** What topping it is called on its card — "Biggest net spender". */
  title: string;
  /**
   * A club's figure on this measure, signed so that more is more — net spend is
   * money out, not a negative balance — or `null` where the club can't claim it.
   *
   * `null` is what makes balance readable from both ends: a club that banked
   * money is placed among the profit-makers and one that spent it among the
   * spenders, because "3rd biggest net spender" is false of a club that came out
   * ahead however the sort happens to order it. No club is eligible for both.
   */
  of: (c: TransferBalanceClub) => number | null;
}

/**
 * The four, in the order they read: spending, then sales, then the net.
 *
 * An array, not a record keyed by metric: the order is a decision, and a record
 * would leave it to however the object literal happened to be written, which
 * nothing states and nothing protects.
 */
export const MEASURES: Measure[] = [
  {
    metric: "expenditure",
    label: "gross spend",
    title: "Gross spend",
    of: (c) => (c.expenditure > 0 ? c.expenditure : null),
  },
  { metric: "income", label: "sales", title: "Sales", of: (c) => (c.income > 0 ? c.income : null) },
  {
    metric: "netSpender",
    label: "net spend",
    title: "Biggest net spender",
    of: (c) => (c.balance < 0 ? -c.balance : null),
  },
  {
    metric: "netProfit",
    label: "net profit",
    title: "Biggest net profit",
    of: (c) => (c.balance > 0 ? c.balance : null),
  },
];

/**
 * How deep a place taken from this dataset is still a real place.
 *
 * The scrape unions four top-25 pages of one Transfermarkt table (see
 * scripts/refresh-transfer-balance.ts), so every club above the 25th on a
 * measure is necessarily in the set — sorting the union on that measure
 * reproduces the true order exactly as far as 25. Past that a club's place is
 * only a lower bound, because the clubs that would sit between it and the ones
 * above are precisely the ones the scrape never fetched. So positions are
 * reported only where they are exact, and a club simply goes unplaced on a
 * measure it isn't near the top of.
 */
export const RANKED_DEPTH = 25;

/** The club on top of one measure in one window, and its figure there. */
export interface BalanceLeader {
  measure: Measure;
  club: TransferBalanceClub;
  value: number;
}

/** A club on top of two or more measures at once. */
export interface BalanceWinner {
  club: TransferBalanceClub;
  measures: Measure[];
}

/** Who tops each measure in one window, in the measures' order, and the clubs
 *  that top two or more of them at once — the tab's own hook. */
export function leadersOf(clubs: TransferBalanceClub[]): {
  leaders: BalanceLeader[];
  winners: BalanceWinner[];
} {
  const leaders = MEASURES.flatMap((measure) => {
    const ranked = clubs.flatMap((club) => {
      const value = measure.of(club);
      return value === null ? [] : [{ measure, club, value }];
    });
    return ranked.sort((a, b) => b.value - a.value).slice(0, 1);
  });

  const tops = new Map<string, BalanceWinner>();
  for (const { measure, club } of leaders) {
    const entry = tops.get(club.id) ?? { club, measures: [] };
    entry.measures.push(measure);
    tops.set(club.id, entry);
  }
  return { leaders, winners: [...tops.values()].filter((w) => w.measures.length >= 2) };
}
