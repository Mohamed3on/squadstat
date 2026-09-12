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

function GameRow({ game }: { game: MatchdayGame }) {
  const [home, away] = game.result.split(":").map(Number);
  // A finished game dims its loser; a draw, or a game still to finish, leaves both lit.
  const done = game.status === "finished";
  return (
    <TableRow>
      <TableCell className="w-1/2 max-w-0">
        <Club club={game.home} lost={done && home < away} className="flex-row-reverse" />
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        <Result game={game} />
      </TableCell>
      <TableCell className="w-1/2 max-w-0">
        <Club club={game.away} lost={done && away < home} />
      </TableCell>
    </TableRow>
  );
}

function Club({
  club,
  lost,
  className,
}: {
  club: MatchdayClub;
  lost: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <TeamLogo src={crestUrl(club.id)} />
      <Link
        href={getTeamDetailHref(club.id)}
        className={cn(
          "truncate font-medium hover:underline",
          lost ? "text-text-muted" : "text-text-primary",
        )}
      >
        {club.name}
      </Link>
    </div>
  );
}

function Result({ game }: { game: MatchdayGame }) {
  if (game.status === "scheduled") {
    return <span className="font-value text-xs text-text-muted">{game.result}</span>;
  }
  const live = game.status === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-value",
        live ? "bg-accent-cold-faint text-accent-cold" : "bg-card text-text-primary",
      )}
    >
      {live && (
        <>
          <span aria-hidden className="size-1.5 rounded-full bg-accent-cold" />
          <span className="sr-only">Live:</span>
        </>
      )}
      {game.result}
    </span>
  );
}
