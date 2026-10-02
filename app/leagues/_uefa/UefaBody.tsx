"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { createContext, useContext, useState, type ReactNode } from "react";
import { ManagerSection, ManagerSkeleton } from "@/app/components/ManagerPPGBadge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTableSort, type SortColumn } from "@/components/SortableTable";
import { formatMillions, getTransfermarktTeamUrl, ordinal } from "@/lib/format";
import { useManagersMap } from "@/lib/hooks/use-manager-query";
import { crestUrl, leagueLogoUrl } from "@/lib/transfermarkt/image";
import {
  ZONE_LABEL,
  type Card as Tie,
  type ClubLite,
  type Knockout,
  type StandingRow,
  type UefaView,
} from "@/lib/uefa/model";
import { compHref, familyOf, type Competition, type Fixture } from "@/lib/uefa/types";
import "@/app/components/tournament.css";

// The two formats differ in words, not in layout.
const COPY = {
  league: {
    noun: "club",
    title: "Table vs Value per Player",
    intro: "in the league phase, ranked by where they sit and by value per player",
    section: "League phase",
    place: "Table",
    pts: [
      "Δ pts = a club’s points − the points of whoever sits at its value rank",
      "so ▲ 4 means four points clear of the club holding its slot",
    ],
    pos: [
      "Δ pos = value rank − finishing position",
      "so ▲ 17 means a club finished seventeen places above its money",
    ],
    opens: "once the league phase has decided who goes where",
    projection: "Projected from the final table under UEFA’s seeding rules",
  },
  groups: {
    noun: "nation",
    title: "Groups vs Value per Player",
    intro: "ranked within their group by where they sit and by value per player",
    section: "Groups",
    place: "Group",
    pts: [
      "Δ pts = a nation’s points − the points of whoever sits at its value rank in the group",
      "so ▲ 4 means four points clear of the nation holding its slot",
    ],
    pos: [
      "Δ pos = value rank − finishing position in the group",
      "so ▲ 2 means a nation finished two places above its money",
    ],
    opens: "once the groups have decided who goes through",
    projection:
      "Projected from the final group tables, each winner drawn against the least valuable runner-up it can meet",
  },
} as const;

type ColKey = "pos" | "club" | "pl" | "gd" | "pts" | "mv" | "valueRank" | "delta";

// Which gap the Δ column measures. While a table is running it is points against
// whoever holds your value-seeded slot — over a handful of games a place turns on
// goal difference, so counting places exaggerates. Once the table has settled,
// places are the honest unit.
type Measure = { key: "pts" | "pos"; label: string; of: (r: StandingRow) => number | null };
const BY_POINTS: Measure = { key: "pts", label: "Δ pts", of: (r) => r.ptsDelta };
const BY_PLACES: Measure = { key: "pos", label: "Δ pos", of: (r) => r.posDelta };

// `numeric` here means "reads largest-first" — it sets the direction a column
// takes when you first sort by it. Points and money read largest-first; a
// finishing position and a value rank read from 1 down, so both say so.
const columnsFor = (m: Measure, side: string): SortColumn<StandingRow, ColKey>[] => [
  { key: "pos", label: "#", numeric: false, value: (r) => r.pos },
  { key: "club", label: side, numeric: false, value: (r) => r.club.name },
  { key: "pl", label: "Pl", numeric: true, value: (r) => r.pl, className: "hidden sm:table-cell" },
  { key: "gd", label: "GD", numeric: true, value: (r) => r.gd, className: "hidden sm:table-cell" },
  { key: "pts", label: "Pts", numeric: true, value: (r) => r.pts },
  { key: "mv", label: "Value per player", numeric: true, value: (r) => r.club.mv },
  { key: "valueRank", label: "Value rank", numeric: false, value: (r) => r.valueRank },
  { key: "delta", label: m.label, numeric: true, value: (r) => m.of(r) ?? 0 },
];

// useTableSort memoises on the column array, so all four are built once at module
// scope rather than rebuilt on every render.
const COLUMNS = {
  club: { pts: columnsFor(BY_POINTS, "Club"), pos: columnsFor(BY_PLACES, "Club") },
  nation: { pts: columnsFor(BY_POINTS, "Nation"), pos: columnsFor(BY_PLACES, "Nation") },
};

// Where each side links on this site — a club's /teams page (see
// getClubIdsWithPages), a nation's players — and, for nations, the flag they wear
// in place of a crest. Anyone with no page here — AEK, Bodø/Glimt and the like —
// links out to Transfermarkt rather than to a not-found page.
type Teams = { links: Record<string, string>; badges?: Record<string, string> };
const TeamsContext = createContext<Teams>({ links: {} });

export function TeamsProvider({ children, ...teams }: Teams & { children: ReactNode }) {
  return <TeamsContext.Provider value={teams}>{children}</TeamsContext.Provider>;
}

function Crest({ id }: { id: string }) {
  const src = useContext(TeamsContext).badges?.[id] ?? crestUrl(id);
  return <img className="crest" src={src} alt="" loading="lazy" />;
}

function ClubLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const href = useContext(TeamsContext).links[id];
  return href ? (
    <Link href={href} className={clsx("hover:underline", className)}>
      {children}
    </Link>
  ) : (
    <a
      href={getTransfermarktTeamUrl(id)}
      target="_blank"
      rel="noopener noreferrer"
      title="On Transfermarkt"
      className={clsx("hover:underline", className)}
    >
      {children}
    </a>
  );
}

function ClubName({ club }: { club: ClubLite }) {
  return (
    <>
      <Crest id={club.id} />
      <ClubLink id={club.id}>
        {/* Transfermarkt's abbreviation on a phone, where "Paris Saint-Germain"
            wraps the row onto two lines; the full name once there's room. */}
        <span className="sm:hidden">{club.short}</span>
        <span className="hidden sm:inline">{club.name}</span>
      </ClubLink>
    </>
  );
}

/** How far above or below its money a side is, in whichever unit the table calls for. */
function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="delta met">—</span>;
  if (value === 0) return <span className="delta met">level</span>;
  return (
    <span className={clsx("delta", value > 0 ? "over" : "under")}>
      {value > 0 ? "▲" : "▼"} {Math.abs(value)}
    </span>
  );
}

/** The small caps line over a table or a matchday, with an optional note opposite. */
function Caption({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <h3 className="mb-1 flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[var(--tny-muted)]">
      <span>{children}</span>
      {aside && <span className="font-value normal-case tracking-normal">{aside}</span>}
    </h3>
  );
}

function LeagueTable({
  rows,
  measure,
  side,
  cutlines,
}: {
  rows: StandingRow[];
  measure: Measure;
  side: "club" | "nation";
  cutlines: boolean; // label each band where it starts, as the 36-club table does
}) {
  const [active, setActive] = useState<string | null>(null);
  const columns = COLUMNS[side][measure.key];
  const table = useTableSort(rows, columns, "pos");
  // The bands only line up while the table is in finishing order.
  const banded = table.sort.key === "pos" && !table.sort.desc;

  return (
    <div className="overflow-x-auto">
      <table className="mv-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(col.key !== "club" && col.key !== "pos" && "r", col.className)}
              >
                <button
                  onClick={() => table.toggle(col.key)}
                  className={clsx(
                    "cursor-pointer",
                    table.sort.key === col.key && "text-[var(--tny-txt)]",
                  )}
                >
                  {col.label}
                  <span className="ml-1 opacity-50">
                    {table.sort.key === col.key ? (table.sort.desc ? "▼" : "▲") : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => (
            <Row
              key={r.club.id}
              row={r}
              active={active}
              onHover={setActive}
              cutline={
                cutlines && banded && i > 0 && r.zone !== table.rows[i - 1].zone
                  ? ZONE_LABEL[r.zone as keyof typeof ZONE_LABEL]
                  : null
              }
              band={banded && r.zone !== null && `z-${r.zone}`}
              measure={measure}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({
  row: r,
  active,
  onHover,
  cutline,
  band,
  measure,
}: {
  row: StandingRow;
  active: string | null;
  onHover: (id: string | null) => void;
  cutline: string | null;
  band: string | false; // the zone stripe down the position column
  measure: Measure;
}) {
  return (
    <>
      {cutline && (
        <tr className="cutline">
          <td colSpan={8}>{cutline}</td>
        </tr>
      )}
      <tr
        className={clsx("row", band, active === r.club.id && "on")}
        onMouseEnter={() => onHover(r.club.id)}
        onMouseLeave={() => onHover(null)}
      >
        <td className="mv-rank">{r.pos}</td>
        <td className="mv-team">
          <ClubName club={r.club} />
        </td>
        <td className="mv-val r hidden sm:table-cell">{r.pl}</td>
        <td className="mv-val r hidden sm:table-cell">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
        <td className="mv-pos r">{r.pts}</td>
        <td className="mv-val r">{formatMillions(r.club.mv)}</td>
        <td className="mv-val r">{r.valueRank}</td>
        <td className="r">
          <Delta value={measure.of(r)} />
        </td>
      </tr>
    </>
  );
}

// ---- Fixtures ----

/** One matchday at a time, opening on the first with a game still to play. Every
 *  matchday stays in the page, for search and find-in-page; only the chosen one shows. */
function Fixtures({ fixtures, matchdays }: { fixtures: Fixture[]; matchdays: number }) {
  const days = Array.from({ length: matchdays }, (_, i) => i + 1);
  const next = days.find((md) => fixtures.some((f) => f.matchday === md && !f.played)) ?? matchdays;
  return (
    <>
      <div className="section-title">Fixtures</div>
      <Tabs defaultValue={String(next)} className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--tny-muted)]">
            Matchday
          </span>
          <TabsList>
            {days.map((md) => (
              <TabsTrigger key={md} value={String(md)} className="min-w-9 font-value">
                {md}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {days.map((md) => (
          <TabsContent
            key={md}
            value={String(md)}
            forceMount
            className="data-[state=inactive]:hidden"
          >
            <Matchday md={md} fixtures={fixtures.filter((f) => f.matchday === md)} />
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function Matchday({ md, fixtures }: { md: number; fixtures: Fixture[] }) {
  // A matchday runs over two or three evenings, so the games are grouped by the
  // one they're played on — otherwise an unplayed fixture shows a kickoff time
  // with no day attached to it.
  const days = [...new Set(fixtures.map((f) => f.dayLabel))];
  const span = days.length > 1 ? `${days[0]} – ${days[days.length - 1]}` : days[0];

  return (
    <div>
      <Caption aside={span}>Matchday {md}</Caption>
      {days.map((day) => (
        <div key={day}>
          <div className="mt-3 text-xs text-[var(--tny-muted)]">
            {fixtures.find((f) => f.dayLabel === day)!.dow}{" "}
            <span className="font-value">{day}</span>
          </div>
          <ul className="divide-y divide-[var(--tny-line)] border-y border-[var(--tny-line)]">
            {fixtures
              .filter((f) => f.dayLabel === day)
              .map((f) => (
                <FixtureRow key={`${f.homeId}-${f.awayId}`} f={f} />
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

type Outcome = "won" | "lost" | "level";

// A played game's winner takes the bracket's win green — a wash over its half of the
// row and its goal tally — and its loser recedes; a draw stays even, with no green.
const NAME: Record<Outcome, string> = {
  won: "font-semibold",
  lost: "text-[var(--tny-muted)]",
  level: "",
};
const GOALS: Record<Outcome, string> = {
  won: "text-[var(--tny-win)]",
  lost: "text-[var(--tny-muted)]",
  level: "",
};

function FixtureRow({ f }: { f: Fixture }) {
  const outcome = (scored: number | null, conceded: number | null): Outcome | null =>
    scored === null || conceded === null
      ? null
      : scored > conceded
        ? "won"
        : scored < conceded
          ? "lost"
          : "level";
  const home = outcome(f.hs, f.as);
  const away = outcome(f.as, f.hs);

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 text-sm sm:gap-4">
      <span
        className={clsx(
          "flex min-w-0 items-center justify-end gap-2 py-2 text-right",
          home === "won" && "bg-gradient-to-l from-[color:var(--tny-win)]/15 to-transparent",
        )}
      >
        <ClubLink id={f.homeId} className={clsx("truncate", home && NAME[home])}>
          {f.home}
        </ClubLink>
        <Crest id={f.homeId} />
      </span>
      <span
        className={clsx(
          "font-value w-20 shrink-0 self-center rounded-md px-2 py-0.5 text-center text-xs sm:text-sm",
          f.played ? "bg-[var(--tny-panel)] text-[var(--tny-txt)]" : "text-[var(--tny-muted)]",
        )}
      >
        {home && away ? (
          <>
            <span className={GOALS[home]}>{f.hs}</span>
            <span className="text-[var(--tny-muted)]">:</span>
            <span className={GOALS[away]}>{f.as}</span>
          </>
        ) : (
          f.timeLabel
        )}
      </span>
      <span
        className={clsx(
          "flex min-w-0 items-center gap-2 py-2",
          away === "won" && "bg-gradient-to-r from-[color:var(--tny-win)]/15 to-transparent",
        )}
      >
        <Crest id={f.awayId} />
        <ClubLink id={f.awayId} className={clsx("truncate", away && NAME[away])}>
          {f.away}
        </ClubLink>
      </span>
    </li>
  );
}

// ---- Bracket ----

function Side({
  club,
  tie,
  score,
  isWinner,
  seed,
}: {
  club: ClubLite | null;
  tie: Tie;
  score: string | null;
  isWinner: boolean;
  seed: number | null;
}) {
  const decided = tie.decided;
  return (
    <div
      className={clsx(
        "bt",
        isWinner && (decided ? "w" : "wp"),
        !isWinner && decided && "l",
        tie.real ? "conf" : "proj",
      )}
    >
      {club ? <Crest id={club.id} /> : null}
      {club ? (
        <ClubLink id={club.id} className="bn">
          {club.short}
        </ClubLink>
      ) : (
        <span className="bn">—</span>
      )}
      {seed !== null && <span className="seedno">{ordinal(seed)}</span>}
      <span className="bv">{score ?? (club ? formatMillions(club.mv) : "")}</span>
    </div>
  );
}

function Bracket({ bracket }: { bracket: Knockout["bracket"] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="t-scroll">
      <div
        className={clsx("bracket", active && "lit")}
        style={{ width: bracket.width, height: bracket.height }}
      >
        <svg className="lines" width={bracket.width} height={bracket.height} aria-hidden>
          {bracket.edges.map((e, i) => (
            <path key={i} d={e.d} className={active === e.club ? "on" : undefined} />
          ))}
        </svg>
        {bracket.labels.map((l) => (
          <div key={l.label} className="rlabel" style={{ left: l.x, width: bracket.cardW }}>
            {l.label}
          </div>
        ))}
        {bracket.cards.map((c) => {
          const [hs, as] = c.score ? c.score.split(":") : [null, null];
          return (
            <div
              key={c.id}
              className={clsx("bcard", c.round === "F" && "isfinal", !c.real && "proj")}
              style={{ left: c.x, top: c.y - bracket.cardH / 2, width: bracket.cardW }}
              onMouseEnter={() => setActive(c.winner)}
              onMouseLeave={() => setActive(null)}
            >
              <Side
                club={c.home}
                tie={c}
                score={hs}
                isWinner={c.winner === c.home?.id}
                seed={c.homeSeed}
              />
              <Side
                club={c.away}
                tie={c}
                score={as}
                isWinner={c.winner === c.away?.id}
                seed={c.awaySeed}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BracketSection({
  ko,
  view,
  copy,
}: {
  ko: Knockout;
  view: UefaView;
  copy: (typeof COPY)[keyof typeof COPY];
}) {
  return (
    <>
      <div className="section-title">Bracket</div>
      <p className="hint">
        {!view.complete
          ? `The bracket opens after matchday ${view.matchdays}, ${copy.opens}.`
          : ko.drawn
            ? "Real ties where the draw has been made; the rest projected, with the higher value per player advancing."
            : `${copy.projection}, with the higher value per player winning every tie.`}
      </p>
      {view.complete && <Bracket bracket={ko.bracket} />}
    </>
  );
}

// ---- Headline cards ----

function Panel({
  gold,
  className,
  children,
}: {
  gold?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={clsx(
        "rounded-2xl bg-[var(--tny-panel)] p-4 text-[var(--tny-txt)] shadow-none",
        gold ? "border-[color:var(--tny-gold)]/40" : "border-[var(--tny-line)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--tny-muted)]">{children}</div>
);

/** The most valuable side still in it — shown from day one, when it is simply the
 *  best squad in the draw. */
function ProjectedWinner({
  club,
  alive,
  total,
  noun,
}: {
  club: ClubLite;
  alive: number;
  total: number;
  noun: string;
}) {
  // Once a single side is left the projection has stopped projecting anything.
  const won = alive === 1;
  return (
    <Panel
      gold
      className="mt-6 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left"
    >
      <div>
        <Label>{won ? "Winner" : "Projected winner"}</Label>
        <div className="mt-1 flex items-center justify-center gap-2 text-base font-semibold sm:justify-start">
          <span aria-hidden>🏆</span>
          <ClubName club={club} />
        </div>
      </div>
      <div className="text-xs text-[var(--tny-muted)] sm:text-right">
        <div>{won ? `The last ${noun} standing` : "The most valuable squad still in it"}</div>
        <div className="mt-0.5">
          <span className="font-value">{formatMillions(club.mv)}</span> per player ·{" "}
          <span className="font-value">{alive}</span> of <span className="font-value">{total}</span>{" "}
          {noun}s left
        </div>
      </div>
    </Panel>
  );
}

/** A league that plays for promotion projects each group's winner, not one champion. */
function GroupWinners({
  leaders,
  prize,
  settled,
}: {
  leaders: NonNullable<UefaView["leaders"]>;
  prize: string;
  settled: boolean;
}) {
  return (
    <Panel gold className="mt-6">
      <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-baseline sm:justify-between sm:text-left">
        <Label>{settled ? prize : "Projected to go up"}</Label>
        <div className="text-xs text-[var(--tny-muted)]">
          {settled
            ? "The four group winners"
            : "The most valuable squad still able to win each group"}
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {leaders.map((l) => (
          <li
            key={l.group}
            className="flex items-center gap-2 rounded-xl bg-[var(--tny-panel2)] px-3 py-2 text-sm"
          >
            <span className="font-value text-[10px] text-[var(--tny-muted)]">G{l.group}</span>
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <ClubName club={l.club} />
            </span>
            <span className="ml-auto font-value text-xs text-[var(--tny-muted)]">
              {formatMillions(l.club.mv)}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** The biggest gap above and below the money. Early on several sides share it
 *  either way, so each card lists every one of them, most valuable first. */
function Callouts({
  rows,
  measure,
  place,
}: {
  rows: StandingRow[];
  measure: Measure;
  place: string;
}) {
  const played = rows.filter((r) => measure.of(r) !== null);
  const gap = (r: StandingRow) => measure.of(r)!;
  const top = Math.max(...played.map(gap));
  const bottom = Math.min(...played.map(gap));
  const levelOn = (g: number) =>
    played.filter((r) => gap(r) === g).sort((a, b) => b.club.mv - a.club.mv);
  const cards =
    top > 0 && bottom < 0
      ? [
          { value: top, word: "Punching above its value", cls: "over", sides: levelOn(top) },
          {
            value: bottom,
            word: "Falling short of its value",
            cls: "under",
            sides: levelOn(bottom),
          },
        ]
      : [];
  // Each side's manager loads after the page, as on Value vs Table: a scrape per side —
  // and for a nation, its record with the friendlies taken out — is too slow to hold
  // the page for.
  const { managersMap, loadingSet } = useManagersMap(
    cards.flatMap((c) => c.sides.map((r) => r.club.id)),
  );
  if (!cards.length) return null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map(({ value, word, cls, sides }) => (
        <Panel key={word}>
          <div className="flex items-baseline justify-between gap-3">
            <Label>{word}</Label>
            <span className={clsx("delta", cls)}>
              {value > 0 ? "▲" : "▼"} {Math.abs(value)}
              {measure === BY_POINTS ? " pts" : ""}
              {sides.length > 1 ? " each" : ""}
            </span>
          </div>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-[var(--tny-muted)]">
                {/* The side takes the slack, so both ranks sit together on the right. */}
                <th className="w-full pb-1 text-left font-normal">
                  <span className="sr-only">Team</span>
                </th>
                <th className="pb-1 text-right font-normal">{place}</th>
                <th className="pb-1 pl-4 text-right font-normal">Value rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--tny-line)]">
              {sides.map((r) => {
                const manager = managersMap[r.club.id];
                return (
                  <tr key={r.club.id}>
                    <td className="py-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <ClubName club={r.club} />
                      </div>
                      {(manager || loadingSet.has(r.club.id)) && (
                        <div className="mt-1 text-xs">
                          {manager ? <ManagerSection manager={manager} /> : <ManagerSkeleton />}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right font-value">{ordinal(r.pos)}</td>
                    <td className="py-2 pl-4 text-right font-value">{ordinal(r.valueRank)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      ))}
    </div>
  );
}

// ---- Page ----

/** The page's heading, as the site's other views open: the competition, what the
 *  page measures and how, and — where a competition has tiers — tabs between them. */
function Hero({ comp, view, measure }: { comp: Competition; view: UefaView; measure: Measure }) {
  const copy = COPY[comp.format];
  const family = familyOf(comp);
  const [formula, example] = measure === BY_POINTS ? copy.pts : copy.pos;
  return (
    <header>
      <div className="flex items-center gap-3 sm:gap-4">
        <img
          src={leagueLogoUrl(comp.code)}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg bg-white/90 object-contain p-1 sm:h-14 sm:w-14"
        />
        <div className="min-w-0">
          <h1 className="font-pixel text-2xl leading-tight text-text-primary sm:text-3xl">
            {comp.name} <span className="text-text-secondary">{copy.title}</span>
          </h1>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            UEFA · <span className="font-value">{view.label}</span>
          </p>
        </div>
      </div>
      {family.length > 1 && (
        <Tabs value={comp.code} className="mt-5">
          <TabsList aria-label={comp.family}>
            {family.map((c) => (
              <TabsTrigger key={c.code} value={c.code} asChild>
                {/* Each tier is its own request-rendered page, and a dynamic route
                    prefetches only down to its loading skeleton, so a switch would
                    blank the whole page to it. Prefetch the page whole instead, and
                    the tab swaps straight from the router cache. */}
                <Link href={compHref(c)} prefetch>
                  {c.tab}
                </Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <p className="mt-4 max-w-3xl text-sm text-text-muted sm:text-base">
        All {view.rows.length} {copy.noun}s {copy.intro} (squad value ÷ squad size).{" "}
        <span className="text-text-primary">{formula}</span>, {example}.
      </p>
    </header>
  );
}

// The places a group's stripes stand for, in the colours the stripes wear.
const SWATCH: Record<string, string> = {
  up: "bg-[var(--tny-win)]",
  po: "bg-[var(--tny-gold)]",
};

export function UefaBody({ comp, view }: { comp: Competition; view: UefaView }) {
  const copy = COPY[comp.format];
  const measure = view.complete ? BY_PLACES : BY_POINTS;
  const ko = view.knockout;
  const grouped = view.tables.length > 1;

  return (
    <div className="tourney page-container">
      <Hero comp={comp} view={view} measure={measure} />

      {ko?.projected && (
        <ProjectedWinner
          club={ko.projected}
          alive={ko.alive}
          total={view.rows.length}
          noun={copy.noun}
        />
      )}
      {view.leaders && comp.format === "groups" && (
        <GroupWinners leaders={view.leaders} prize={comp.bands[0].label} settled={view.complete} />
      )}
      <Callouts rows={view.rows} measure={measure} place={copy.place} />

      <div className="section-title">
        {copy.section} · matchday {view.matchday} of {view.matchdays}
      </div>
      <p className="hint">{comp.rules} Click a column to re-sort.</p>
      {comp.format === "groups" && (
        <div className="legend">
          {comp.bands.map((b) => (
            <span key={b.zone}>
              <i className={SWATCH[b.zone]} />
              {b.label}
            </span>
          ))}
        </div>
      )}
      <div
        className={clsx(
          "mx-auto grid max-w-5xl gap-8",
          grouped && "mt-6 xl:max-w-none xl:grid-cols-2",
        )}
      >
        {view.tables.map((t) => (
          <div key={t.title ?? "table"} className="min-w-0">
            {t.title && <Caption>{t.title}</Caption>}
            <LeagueTable rows={t.rows} measure={measure} side={copy.noun} cutlines={!grouped} />
          </div>
        ))}
      </div>

      {ko && <BracketSection ko={ko} view={view} copy={copy} />}

      <Fixtures fixtures={view.fixtures} matchdays={view.matchdays} />

      <div className="t-foot">
        Market values and results from Transfermarkt, refreshed through the day.
      </div>
    </div>
  );
}
