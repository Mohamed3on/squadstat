"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { formatMillions, getTeamDetailHref, ordinal } from "@/lib/format";
import { crestUrl } from "@/lib/transfermarkt/image";
import { useTableSort, type SortColumn } from "@/components/SortableTable";
import { ZONE_LABEL, type ClCard, type ClModel, type ClRow, type ClubLite } from "@/lib/cl/model";
import type { ClFixture } from "@/lib/cl/types";
import "@/app/components/tournament.css";

type ColKey = "pos" | "club" | "pl" | "gd" | "pts" | "mv" | "valueRank" | "delta";

// Which gap the Δ column measures. While the league phase is running it is
// points against whoever holds your value-seeded slot — over eight games a place
// in a 36-club table turns on goal difference, so counting places exaggerates.
// Once the table has settled, places are the honest unit.
type Measure = { key: "pts" | "pos"; label: string; of: (r: ClRow) => number | null };
const BY_POINTS: Measure = { key: "pts", label: "Δ pts", of: (r) => r.ptsDelta };
const BY_PLACES: Measure = { key: "pos", label: "Δ pos", of: (r) => r.posDelta };

// `numeric` here means "reads largest-first" — it sets the direction a column
// takes when you first sort by it. Points and money read largest-first; a
// finishing position and a value rank read from 1 down, so both say so.
const columnsFor = (m: Measure): SortColumn<ClRow, ColKey>[] => [
  { key: "pos", label: "#", numeric: false, value: (r) => r.pos },
  { key: "club", label: "Club", numeric: false, value: (r) => r.club.name },
  { key: "pl", label: "Pl", numeric: true, value: (r) => r.pl, className: "hidden sm:table-cell" },
  { key: "gd", label: "GD", numeric: true, value: (r) => r.gd, className: "hidden sm:table-cell" },
  { key: "pts", label: "Pts", numeric: true, value: (r) => r.pts },
  { key: "mv", label: "Value per player", numeric: true, value: (r) => r.club.mv },
  { key: "valueRank", label: "Value rank", numeric: false, value: (r) => r.valueRank },
  { key: "delta", label: m.label, numeric: true, value: (r) => m.of(r) ?? 0 },
];

// useTableSort memoises on the column array, so both are built once at module
// scope rather than rebuilt on every render.
const COLUMNS: Record<Measure["key"], SortColumn<ClRow, ColKey>[]> = {
  pts: columnsFor(BY_POINTS),
  pos: columnsFor(BY_PLACES),
};

const Crest = ({ id }: { id: string }) => (
  <img className="crest" src={crestUrl(id)} alt="" loading="lazy" />
);

function ClubName({ club }: { club: ClubLite }) {
  return (
    <>
      <Crest id={club.id} />
      <Link href={getTeamDetailHref(club.id)} className="hover:underline">
        {/* Transfermarkt's abbreviation on a phone, where "Paris Saint-Germain"
            wraps the row onto two lines; the full name once there's room. */}
        <span className="sm:hidden">{club.short}</span>
        <span className="hidden sm:inline">{club.name}</span>
      </Link>
    </>
  );
}

/** How far above or below its money a club is, in whichever unit the phase calls for. */
function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="delta met">—</span>;
  if (value === 0) return <span className="delta met">level</span>;
  return (
    <span className={clsx("delta", value > 0 ? "over" : "under")}>
      {value > 0 ? "▲" : "▼"} {Math.abs(value)}
    </span>
  );
}

function LeagueTable({
  rows,
  measure,
  active,
  onHover,
}: {
  rows: ClRow[];
  measure: Measure;
  active: string | null;
  onHover: (id: string | null) => void;
}) {
  const columns = COLUMNS[measure.key];
  const table = useTableSort(rows, columns, "pos");
  // The three bands only line up while the table is in finishing order.
  const banded = table.sort.key === "pos" && !table.sort.desc;

  return (
    <div className="mx-auto max-w-5xl overflow-x-auto">
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
          {table.rows.map((r) => (
            <Row
              key={r.club.id}
              row={r}
              active={active}
              onHover={onHover}
              cutline={banded && (r.pos === 9 || r.pos === 25) ? ZONE_LABEL[r.zone] : null}
              banded={banded}
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
  banded,
  measure,
}: {
  row: ClRow;
  active: string | null;
  onHover: (id: string | null) => void;
  cutline: string | null;
  banded: boolean;
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
        className={clsx("row", banded && `z-${r.zone}`, active === r.club.id && "on")}
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

function Matchday({ md, fixtures }: { md: number; fixtures: ClFixture[] }) {
  // A matchday runs over two or three evenings, so the games are grouped by the
  // one they're played on — otherwise an unplayed fixture shows a kickoff time
  // with no day attached to it.
  const days = [...new Set(fixtures.map((f) => f.dayLabel))];
  const span = days.length > 1 ? `${days[0]} – ${days[days.length - 1]}` : days[0];

  return (
    <div className="mx-auto mt-8 max-w-5xl first:mt-4">
      <h3 className="mb-1 flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[var(--tny-muted)]">
        <span>Matchday {md}</span>
        <span className="font-value normal-case tracking-normal">{span}</span>
      </h3>
      {days.map((day) => (
        <div key={day}>
          <div className="mt-3 text-[11px] text-[var(--tny-muted)]">
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

function FixtureRow({ f }: { f: ClFixture }) {
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
        <span className={clsx("truncate", home && NAME[home])}>{f.home}</span>
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
        <span className={clsx("truncate", away && NAME[away])}>{f.away}</span>
      </span>
    </li>
  );
}

// ---- Bracket ----

function Side({
  club,
  card,
  score,
  isWinner,
  seed,
}: {
  club: ClubLite | null;
  card: ClCard;
  score: string | null;
  isWinner: boolean;
  seed: number | null;
}) {
  const decided = card.decided;
  return (
    <div
      className={clsx(
        "bt",
        isWinner && (decided ? "w" : "wp"),
        !isWinner && decided && "l",
        card.real ? "conf" : "proj",
      )}
    >
      {club ? <Crest id={club.id} /> : null}
      <span className="bn">{club?.short ?? "—"}</span>
      {seed !== null && <span className="seedno">{ordinal(seed)}</span>}
      <span className="bv">{score ?? (club ? formatMillions(club.mv) : "")}</span>
    </div>
  );
}

function Bracket({ model }: { model: ClModel }) {
  const { bracket } = model;
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
                card={c}
                score={hs}
                isWinner={c.winner === c.home?.id}
                seed={c.homeSeed}
              />
              <Side
                club={c.away}
                card={c}
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

// ---- Page ----

export function ChampionsLeague({ model }: { model: ClModel }) {
  const [active, setActive] = useState<string | null>(null);
  // Mid-league-phase, places swing on goal difference, so the gap is counted in
  // points; once the eight games are in, places are the honest unit.
  const measure = model.leaguePhaseComplete ? BY_PLACES : BY_POINTS;
  const played = model.rows.filter((r) => measure.of(r) !== null);
  const gap = (r: ClRow) => measure.of(r)!;
  const best = played.reduce<ClRow | null>((a, r) => (!a || gap(r) > gap(a) ? r : a), null);
  const worst = played.reduce<ClRow | null>((a, r) => (!a || gap(r) < gap(a) ? r : a), null);

  return (
    <div className="tourney page-container">
      <header className="t-hero">
        <div className="kicker">UEFA Champions League {model.label}</div>
        <h1 className="t-title">Table vs Value per Player</h1>
        <p className="rule">
          All 36 clubs in the league phase, ranked by where they actually sit and by value per
          player (squad value ÷ squad size).{" "}
          {measure === BY_POINTS ? (
            <>
              <b>Δ pts = a club&rsquo;s points − the points of whoever sits at its value rank</b>,
              so ▲ 4 means four points clear of the club holding its slot.
            </>
          ) : (
            <>
              <b>Δ pos = value rank − finishing position</b>, so ▲ 17 means a club finished
              seventeen places above its money.
            </>
          )}
        </p>
      </header>

      {best && worst && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { row: best, word: "Punching above its value", cls: "over" },
            { row: worst, word: "Falling short of its value", cls: "under" },
          ].map(({ row, word, cls }) => (
            <div
              key={word}
              className="rounded-2xl border border-[var(--tny-line)] bg-[var(--tny-panel)] p-4"
            >
              <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--tny-muted)]">
                {word}
              </div>
              <div className="mt-2 flex items-center gap-2 text-base font-bold">
                <ClubName club={row.club} />
              </div>
              <div className="mt-1 text-sm text-[var(--tny-muted)]">
                <span className="font-value">{ordinal(row.pos)}</span> in the table,{" "}
                <span className="font-value">{ordinal(row.valueRank)}</span> by value per player{" "}
                <span className={clsx("delta", cls)}>
                  {gap(row) > 0 ? "▲" : "▼"} {Math.abs(gap(row))}
                  {measure === BY_POINTS ? " pts" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title">
        League phase · matchday {model.matchday} of {model.matchdays}
      </div>
      <p className="hint">
        Top eight go straight to the last 16, ninth to 24th into the play-off round, the rest are
        out. Click a column to re-sort.
      </p>
      <LeagueTable rows={model.rows} measure={measure} active={active} onHover={setActive} />

      <div className="section-title">Bracket</div>
      {model.leaguePhaseComplete ? (
        <>
          <p className="hint">
            {model.koDrawn
              ? "Real ties where the draw has been made; the rest projected, with the higher value per player advancing."
              : "Projected from the final table under UEFA's seeding rules, with the higher value per player winning every tie."}
          </p>
          <Bracket model={model} />
        </>
      ) : (
        <p className="hint">
          The bracket opens after matchday {model.matchdays}, once the league phase has decided who
          goes where.
        </p>
      )}

      <div className="section-title">Fixtures</div>
      {Array.from({ length: model.matchdays }, (_, i) => i + 1).map((md) => (
        <Matchday key={md} md={md} fixtures={model.fixtures.filter((f) => f.matchday === md)} />
      ))}

      <div className="t-foot">
        Market values and results from Transfermarkt, refreshed through the day.
      </div>
    </div>
  );
}
