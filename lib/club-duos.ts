import type { MinutesValuePlayer } from "@/app/types";
import { extractClubIdFromLogoUrl } from "@/lib/format";
import { npga } from "@/lib/stats-toggles";

export interface ClubDuoMember {
  player: MinutesValuePlayer;
  /** npG+A for the current club (G+A when penalties are included). */
  points: number;
  minutes: number;
}

export interface ClubDuo {
  clubId: string;
  club: string;
  league: string;
  members: ClubDuoMember[];
  total: number;
  minutes: number;
}

/** Every club's best scoring duo (size 2) or trio (size 3), best first. Only output for
 *  the player's current club counts, every member needs a goal or assist, and ties go
 *  to fewer club minutes (as the Players page's G+A sort does), then to name. Pure and
 *  client-safe: the Players page reruns it as its league and penalty filters change. */
export function rankClubDuos(
  players: MinutesValuePlayer[],
  size: 2 | 3,
  opts?: { includePenalties?: boolean },
): ClubDuo[] {
  const byClub = new Map<string, ClubDuoMember[]>();
  for (const player of players) {
    const clubId = extractClubIdFromLogoUrl(player.clubLogoUrl);
    const stats = player.currentClubStats;
    if (!clubId || !stats) continue;
    const points = npga(stats, opts);
    if (points < 1) continue;
    const members = byClub.get(clubId) ?? [];
    members.push({ player, points, minutes: stats.minutes });
    byClub.set(clubId, members);
  }

  const duos: ClubDuo[] = [];
  for (const [clubId, candidates] of byClub) {
    if (candidates.length < size) continue;
    const members = candidates
      .sort(
        (a, b) =>
          b.points - a.points ||
          a.minutes - b.minutes ||
          a.player.name.localeCompare(b.player.name),
      )
      .slice(0, size);
    duos.push({
      clubId,
      club: members[0].player.club,
      league: members[0].player.league,
      members,
      total: members.reduce((s, m) => s + m.points, 0),
      minutes: members.reduce((s, m) => s + m.minutes, 0),
    });
  }
  return duos.sort(
    (a, b) => b.total - a.total || a.minutes - b.minutes || a.club.localeCompare(b.club),
  );
}
