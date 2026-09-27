"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMillions } from "@/lib/format";
import type { GroupRow, NationsModel } from "@/lib/uefa/nations-league";
import { NATIONS_LEAGUES, type NationsLeague } from "@/lib/uefa/types";
import {
  BY_PLACES,
  BY_POINTS,
  Bracket,
  Callouts,
  ClubName,
  Fixtures,
  ProjectedWinner,
  Row,
  type Measure,
} from "./LeaguePhase";
import "@/app/components/tournament.css";

function GroupTable({
  rows,
  measure,
  active,
  onHover,
  band,
}: {
  rows: GroupRow[];
  measure: Measure;
  active: string | null;
  onHover: (id: string | null) => void;
  band: (pos: number) => string | false;
}) {
  return (
    <div className="mx-auto mt-8 max-w-5xl first:mt-4">
      <h3 className="mb-1 text-xs uppercase tracking-[0.16em] text-[var(--tny-muted)]">
        Group {rows[0].group}
      </h3>
      <div className="overflow-x-auto">
        <table className="mv-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nation</th>
              <th className="r hidden sm:table-cell">Pl</th>
              <th className="r hidden sm:table-cell">GD</th>
              <th className="r">Pts</th>
              <th className="r">Value per player</th>
              <th className="r">Value rank</th>
              <th className="r">{measure.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row
                key={r.club.id}
                row={r}
                active={active}
                onHover={onHover}
                band={band(r.pos)}
                measure={measure}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** League B plays for promotion, not a trophy, so it projects all four group
 *  winners rather than one champion. */
function GroupWinners({ leaders }: { leaders: NationsModel["leaders"] }) {
  const settled = leaders.every((l) => l.decided);
  return (
    <div className="mt-6 rounded-2xl border border-[color:var(--tny-gold)]/40 bg-[var(--tny-panel)] p-4">
      <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-baseline sm:justify-between sm:text-left">
        <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--tny-muted)]">
          {settled ? "Promoted to League A" : "Projected to go up"}
        </div>
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
            <span className="font-value text-[11px] text-[var(--tny-muted)]">G{l.group}</span>
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <ClubName club={l.club} />
            </span>
            <span className="ml-auto font-value text-xs text-[var(--tny-muted)]">
              {formatMillions(l.club.mv)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GroupPhase({ model, nl }: { model: NationsModel; nl: NationsLeague }) {
  const [active, setActive] = useState<string | null>(null);
  // As in the league phase: points while the groups run, places once they're done.
  const measure = model.complete ? BY_PLACES : BY_POINTS;
  const ko = model.knockout;
  const other = nl.finals ? NATIONS_LEAGUES.UNLB : NATIONS_LEAGUES.UNLA;
  // The places that carry something: League A's top two reach the quarter-finals;
  // League B's winner goes up and its runner-up into a play-off.
  const band = (pos: number) =>
    pos === 1 || (pos === 2 && nl.finals) ? "z-up" : pos === 2 && "z-po";

  return (
    <div className="tourney page-container">
      <header className="t-hero">
        <div className="kicker">
          UEFA {nl.name} {model.label}
        </div>
        <h1 className="t-title">Groups vs Value per Player</h1>
        <p className="rule">
          All 16 nations, ranked within their group by where they sit and by value per player (squad
          value ÷ squad size).{" "}
          {measure === BY_POINTS ? (
            <>
              <b>
                Δ pts = a nation&rsquo;s points − the points of whoever sits at its value rank in
                the group
              </b>
              , so ▲ 4 means four points clear of the nation holding its slot.
            </>
          ) : (
            <>
              <b>Δ pos = value rank − finishing position in the group</b>, so ▲ 2 means a nation
              finished two places above its money.
            </>
          )}{" "}
          <Link href={`/leagues/${other.slug}`} className="t-link">
            {other.name} →
          </Link>
        </p>
      </header>

      {ko ? (
        ko.projected && (
          <ProjectedWinner
            club={ko.projected}
            alive={ko.alive}
            total={model.rows.length}
            noun="nation"
          />
        )
      ) : (
        <GroupWinners leaders={model.leaders} />
      )}
      <Callouts rows={model.rows} measure={measure} place="Group" />

      <div className="section-title">
        Groups · matchday {model.matchday} of {model.matchdays}
      </div>
      <p className="hint">
        {nl.finals
          ? "The top two in each group go through to the quarter-finals; the rest fight to stay in League A."
          : "Group winners go up to League A and runners-up into a promotion play-off; the rest fight to stay in League B."}
      </p>
      {model.groups.map((rows) => (
        <GroupTable
          key={rows[0].group}
          rows={rows}
          measure={measure}
          active={active}
          onHover={setActive}
          band={band}
        />
      ))}

      {ko && (
        <>
          <div className="section-title">Bracket</div>
          {model.complete ? (
            <>
              <p className="hint">
                {ko.drawn
                  ? "Real ties where the draw has been made; the rest projected, with the higher value per player advancing."
                  : "Projected from the final group tables, each winner drawn against the least valuable runner-up it can meet, with the higher value per player winning every tie."}
              </p>
              <Bracket bracket={ko.bracket} />
            </>
          ) : (
            <p className="hint">
              The bracket opens after matchday {model.matchdays}, once the groups have decided who
              goes through.
            </p>
          )}
        </>
      )}

      <Fixtures fixtures={model.fixtures} matchdays={model.matchdays} />

      <div className="t-foot">
        Market values and results from Transfermarkt, refreshed through the day.
      </div>
    </div>
  );
}
