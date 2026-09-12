import { Fragment } from "react";
import Link from "next/link";
import type { MatchdayClub, MatchdayGame } from "@/app/types";
import { TeamLogo } from "@/components/TeamLogo";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { getTeamDetailHref } from "@/lib/format";
import { crestUrl } from "@/lib/transfermarkt/image";
import { cn } from "@/lib/utils";

// Dates are calendar days, read at noon UTC so no zone can shift them.
const noon = (iso: string) => new Date(iso ? `${iso}T12:00:00Z` : Date.now());
const DAY = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
// TM prints kickoffs in German time: CEST through the summer, CET in winter.
const TM_ZONE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  timeZoneName: "short",
});

/** "7 of 10 games played — kickoff times in CEST." */
export function matchdaySummary(games: MatchdayGame[]): string {
  const played = games.filter((g) => g.status === "finished").length;
  const count = `${played === games.length ? "All" : `${played} of`} ${games.length} games played`;
  const next = games.find((g) => g.status === "scheduled");
  if (!next) return `${count}.`;
  const zone = TM_ZONE.formatToParts(noon(next.date)).find((p) => p.type === "timeZoneName");
  return `${count} — kickoff times in ${zone?.value}.`;
}

export function MatchdayTable({ games }: { games: MatchdayGame[] }) {
  const days = [...new Set(games.map((g) => g.date))];
  return (
    <Table>
      <TableBody>
        {days.map((day) => (
          <Fragment key={day}>
            <TableRow className="border-border-subtle bg-black/20">
              <TableHead
                colSpan={3}
                className="text-left text-[10px] uppercase tracking-[0.18em] text-text-muted"
              >
                {day ? DAY.format(noon(day)) : "Date to be confirmed"}
              </TableHead>
            </TableRow>
            {games
              .filter((g) => g.date === day)
              .map((g) => (
                <GameRow key={`${g.home.id}-${g.away.id}`} game={g} />
              ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

type Outcome = "won" | "lost" | "level";

// A finished game's winner takes the brand green — a wash over its half of the row
// and its goal tally — and its loser recedes; a draw stays even, with no green at all.
const NAME: Record<Outcome, string> = {
  won: "font-semibold text-text-primary",
  lost: "text-text-secondary",
  level: "text-text-primary",
};
const GOALS: Record<Outcome, string> = {
  won: "text-accent-hot",
  lost: "text-text-secondary",
  level: "text-text-primary",
};

function GameRow({ game }: { game: MatchdayGame }) {
  const [home, away] = game.result.split(":").map(Number);
  const outcome = (scored: number, conceded: number): Outcome | null =>
    game.status !== "finished"
      ? null
      : scored > conceded
        ? "won"
        : scored < conceded
          ? "lost"
          : "level";
  const homeOutcome = outcome(home, away);
  const awayOutcome = outcome(away, home);
  return (
    <TableRow>
      <TableCell
        className={cn(
          "w-1/2 max-w-0",
          homeOutcome === "won" && "bg-gradient-to-l from-accent-hot/10 to-transparent",
        )}
      >
        <Club club={game.home} outcome={homeOutcome} className="flex-row-reverse" />
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {homeOutcome && awayOutcome ? (
          <span className="inline-flex rounded-md bg-card px-2 py-0.5 font-value">
            <span className={GOALS[homeOutcome]}>{home}</span>
            <span className="text-text-muted">:</span>
            <span className={GOALS[awayOutcome]}>{away}</span>
          </span>
        ) : (
          <Pending game={game} />
        )}
      </TableCell>
      <TableCell
        className={cn(
          "w-1/2 max-w-0",
          awayOutcome === "won" && "bg-gradient-to-r from-accent-hot/10 to-transparent",
        )}
      >
        <Club club={game.away} outcome={awayOutcome} />
      </TableCell>
    </TableRow>
  );
}

function Club({
  club,
  outcome,
  className,
}: {
  club: MatchdayClub;
  outcome: Outcome | null;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <TeamLogo src={crestUrl(club.id)} />
      <Link
        href={getTeamDetailHref(club.id)}
        className={cn(
          "truncate font-medium hover:underline",
          outcome ? NAME[outcome] : "text-text-primary",
        )}
      >
        {club.name}
      </Link>
    </div>
  );
}

/** A game not yet over: its running score while live, else TM's kickoff time. */
function Pending({ game }: { game: MatchdayGame }) {
  if (game.status === "scheduled") {
    return <span className="font-value text-xs text-text-muted">{game.result}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-cold-faint px-2 py-0.5 font-value text-accent-cold">
      <span aria-hidden className="size-1.5 rounded-full bg-accent-cold" />
      <span className="sr-only">Live:</span>
      {game.result}
    </span>
  );
}
