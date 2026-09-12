import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeagueBadge } from "@/components/LeagueBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { PlayerListRow } from "@/components/PlayerListRow";
import { RankBadge } from "@/components/RankBadge";
import { BASE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  extractClubIdFromLogoUrl,
  formatInjuryDuration,
  formatReturnInfo,
  formatValueStr,
  getPlayerDetailHref,
  getPlayerIdFromProfileUrl,
  getTeamDetailHref,
} from "@/lib/format";
import type { InjuredPlayer } from "@/app/types";

export function InjuredPlayerCard({
  player,
  rank,
  index = 0,
  showLeague = true,
}: {
  player: InjuredPlayer;
  rank: number;
  index?: number;
  showLeague?: boolean;
}) {
  const returnInfo = formatReturnInfo(player.returnDate);
  const duration = formatInjuryDuration(player.injurySince);
  const playerId = getPlayerIdFromProfileUrl(player.profileUrl);
  const detailHref = playerId ? getPlayerDetailHref(playerId) : null;
  const clubId = extractClubIdFromLogoUrl(player.clubLogoUrl);

  return (
    <Card
      className="hover-lift animate-slide-up"
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <RankBadge rank={rank} />

          <PlayerAvatar
            imageUrl={player.imageUrl}
            name="?"
            className="w-11 h-11 sm:w-14 sm:h-14 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {detailHref ? (
                  <Link
                    href={detailHref}
                    className="font-bold text-sm sm:text-base hover:underline block text-text-primary"
                  >
                    {player.name}
                  </Link>
                ) : (
                  <a
                    href={player.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm sm:text-base hover:underline block text-text-primary"
                  >
                    {player.name}
                  </a>
                )}
                <p className="text-xs sm:text-sm text-text-muted">{player.position}</p>
              </div>
              <span className="text-sm sm:text-lg font-medium shrink-0 text-accent-hot font-value">
                {formatValueStr(player.marketValue)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
              {player.clubLogoUrl && (
                <img
                  src={player.clubLogoUrl}
                  alt={player.club}
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain bg-white rounded p-0.5"
                />
              )}
              {clubId ? (
                <Link
                  href={getTeamDetailHref(clubId)}
                  className="text-xs sm:text-sm text-text-secondary hover:underline hover:text-text-primary transition-colors"
                >
                  {player.club}
                </Link>
              ) : (
                <span className="text-xs sm:text-sm text-text-secondary">{player.club}</span>
              )}
              {showLeague && <LeagueBadge league={player.league} />}
            </div>

            <div
              className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm"
              suppressHydrationWarning
            >
              <Badge variant="destructive" className="gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{player.injury}</span>
                {duration && (
                  <>
                    <span className="opacity-50">·</span>
                    <span suppressHydrationWarning>out {duration}</span>
                  </>
                )}
              </Badge>
              {returnInfo && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] sm:text-xs",
                    returnInfo.imminent &&
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  )}
                  suppressHydrationWarning
                >
                  {returnInfo.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** The same player condensed to one list row — injury and time out on the detail
 *  line, value and expected return on the right — for summaries like a league page. */
export function InjuredPlayerRow({ player, rank }: { player: InjuredPlayer; rank: number }) {
  const returnInfo = formatReturnInfo(player.returnDate);
  const duration = formatInjuryDuration(player.injurySince);
  const playerId = getPlayerIdFromProfileUrl(player.profileUrl);

  return (
    <PlayerListRow
      href={playerId ? getPlayerDetailHref(playerId) : `${BASE_URL}${player.profileUrl}`}
      rank={rank}
      name={player.name}
      imageUrl={player.imageUrl}
      detail={
        <>
          {player.clubLogoUrl && (
            <img
              src={player.clubLogoUrl}
              alt={player.club}
              title={player.club}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
          )}
          <span className="truncate">
            <span className="text-accent-cold-soft">{player.injury}</span>
            {duration && ` · out ${duration}`}
          </span>
        </>
      }
    >
      <div className="shrink-0 text-right">
        <p className="text-sm font-value text-accent-hot">{formatValueStr(player.marketValue)}</p>
        {returnInfo && (
          <p
            className={cn(
              "text-[10px]",
              returnInfo.imminent ? "text-emerald-400" : "text-text-muted",
            )}
          >
            {returnInfo.label}
          </p>
        )}
      </div>
    </PlayerListRow>
  );
}
