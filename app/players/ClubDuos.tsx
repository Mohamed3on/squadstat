"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FeedPanel } from "@/components/FeedPanel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { RankBadge } from "@/components/RankBadge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { InfoTip } from "@/app/components/InfoTip";
import { rankClubDuos, type ClubDuo } from "@/lib/club-duos";
import { filterPlayersByLeagueAndClub } from "@/lib/filter-players";
import { getPlayerDetailHref, getTeamDetailHref } from "@/lib/format";
import { useQueryParams } from "@/lib/hooks/use-query-params";
import { crestUrl } from "@/lib/transfermarkt/image";
import type { MinutesValuePlayer } from "@/app/types";

const SHOWN = 5;

function leagueScope(leagueFilter: string): string {
  if (leagueFilter === "all") return "All leagues";
  if (leagueFilter === "top5") return "Top 5 leagues";
  return leagueFilter;
}

function Crest({ clubId, className }: { clubId: string; className: string }) {
  return (
    <img
      src={crestUrl(clubId)}
      alt=""
      loading="lazy"
      className={`shrink-0 rounded-sm bg-white/90 object-contain p-px ${className}`}
    />
  );
}

function PlayerLink({ player }: { player: MinutesValuePlayer }) {
  return (
    <Link
      href={getPlayerDetailHref(player.playerId)}
      className="transition-colors hover:text-text-primary hover:underline"
    >
      {player.name}
    </Link>
  );
}

/** One leader line: the club, each member's own figure, and the sum they add up to. */
function LeaderLine({ duo, label }: { duo: ClubDuo; label: string }) {
  // Inline flow, so a long trio wraps like a sentence instead of dropping a whole block.
  return (
    <p className="text-sm text-text-secondary">
      <Crest clubId={duo.clubId} className="mr-1.5 inline-block size-4 align-middle" />
      <Link
        href={getTeamDetailHref(duo.clubId)}
        className="mr-2 font-bold text-text-primary hover:underline"
      >
        {duo.club}
      </Link>
      {duo.members.map((m, j) => (
        <Fragment key={m.player.playerId}>
          {j > 0 && <span className="text-text-muted"> + </span>}
          <PlayerLink player={m.player} /> <span className="font-value">{m.points}</span>
        </Fragment>
      ))}
      <span className="text-text-muted"> = </span>
      <span className="font-value text-text-primary">{duo.total}</span>{" "}
      <span className="text-xs text-text-muted">{label}</span>
    </p>
  );
}

/** Each club's best scoring duo and trio, under the Players page header. The leading duo
 *  and trio stay in view as two lines; the top five open on demand, so the explorer below
 *  keeps the lead. Follows the page's league filter and penalties toggle; every other
 *  filter describes players, not clubs. */
export function ClubDuos({
  players,
  leagueFilter,
  includePen,
}: {
  players: MinutesValuePlayer[];
  leagueFilter: string;
  includePen: boolean;
}) {
  const { params, update } = useQueryParams("/players");
  const size = params.get("trio") === "1" ? 3 : 2;
  // A shared trios link means someone already opened the top five.
  const [open, setOpen] = useState(size === 3);
  const hasData = useMemo(() => players.some((p) => p.currentClubStats), [players]);
  // Ranked here rather than on the server: the league, penalties and duo/trio controls
  // all change the URL shallowly, so the server never re-renders for them.
  const [duos, trios] = useMemo(() => {
    const pool = filterPlayersByLeagueAndClub(players, leagueFilter, "all");
    const opts = { includePenalties: includePen };
    return [rankClubDuos(pool, 2, opts), rankClubDuos(pool, 3, opts)];
  }, [players, leagueFilter, includePen]);

  // The data refresh hasn't recorded current-club figures yet.
  if (!hasData) return null;

  const label = includePen ? "G+A" : "npG+A";
  const scope = leagueScope(leagueFilter);
  const count = size === 3 ? "three" : "two";
  const where =
    leagueFilter === "all" ? "" : ` in ${leagueFilter === "top5" ? "the top 5 leagues" : scope}`;
  const shown = (size === 3 ? trios : duos).slice(0, SHOWN);
  const leaders = [
    { term: "Best duo", duo: duos[0] },
    { term: "Best trio", duo: trios[0] },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
      <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-elevated px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4">
        <dl className="min-w-0 flex-1 space-y-1.5">
          {leaders.map(({ term, duo }) => (
            <div
              key={term}
              className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
            >
              <dt className="shrink-0 text-xs text-text-muted sm:w-16">{term}</dt>
              <dd className="min-w-0 flex-1">
                {duo ? (
                  <LeaderLine duo={duo} label={label} />
                ) : (
                  <span className="text-sm text-text-muted">None yet{where}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <CollapsibleTrigger className="group/duos inline-flex shrink-0 cursor-pointer items-center gap-1 self-end text-xs font-medium text-text-muted transition-colors hover:text-text-secondary sm:self-center">
          Top {SHOWN}
          <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]/duos:rotate-180" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-3">
        <FeedPanel
          as="h2"
          title={size === 3 ? "Best Scoring Trios" : "Best Scoring Duos"}
          description={
            <>
              Combined {label} for their current club · tracked players · {scope}{" "}
              <InfoTip className="align-middle">
                <p>
                  Each club&apos;s {count} tracked players with the most {label} for the club they
                  play for now, added together.
                </p>
                <p className="mt-1">
                  Goals and assists for a previous club this season, or for a national team,
                  don&apos;t count. Every player needs a goal or assist, and ties go to fewer
                  minutes for the club.
                </p>
              </InfoTip>
            </>
          }
          action={
            <ToggleGroup
              type="single"
              value={String(size)}
              onValueChange={(v) => v && update({ trio: v === "3" ? "1" : null })}
              variant="outline"
              size="sm"
              aria-label="Duos or trios"
              className="shrink-0 rounded-lg"
            >
              {(["2", "3"] as const).map((v, i) => (
                <ToggleGroupItem
                  key={v}
                  value={v}
                  className={`${i === 0 ? "rounded-l-lg" : "rounded-r-lg"} text-text-muted data-[state=on]:bg-card-hover`}
                >
                  {v === "3" ? "Trios" : "Duos"}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          }
          ordered
          emptyText={`No club${where} has ${count} tracked players with a goal or assist yet.`}
        >
          {shown.map((duo, i) => (
            <li key={duo.clubId} className="flex items-center gap-3 px-4 py-3">
              <div className="hidden sm:block">
                <RankBadge rank={i + 1} />
              </div>
              <Crest clubId={duo.clubId} className="size-6" />
              <div className="min-w-0 flex-1">
                <Link
                  href={getTeamDetailHref(duo.clubId)}
                  className="text-sm font-bold text-text-primary hover:underline"
                >
                  {duo.club}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-text-secondary">
                  {duo.members.map((m, j) => (
                    <Fragment key={m.player.playerId}>
                      {j > 0 && <span className="text-text-muted">+</span>}
                      <span className="inline-flex items-center gap-1.5">
                        <PlayerAvatar
                          imageUrl={m.player.imageUrl}
                          name={m.player.name}
                          className="hidden size-5 sm:flex"
                        />
                        <PlayerLink player={m.player} />
                        <span className="font-value text-text-primary">{m.points}</span>
                      </span>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-value text-base text-text-primary">{duo.total}</div>
                <div className="text-[10px] text-text-muted">{label}</div>
              </div>
            </li>
          ))}
        </FeedPanel>
      </CollapsibleContent>
    </Collapsible>
  );
}
