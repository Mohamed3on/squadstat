import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";
import { MinutesValueUI } from "./MinutesValueUI";

export const metadata: Metadata = {
  title: "Benched Stars | FormTracker",
  description:
    "High-value football players getting the fewest minutes across Europe's top leagues.",
};

export default async function MinutesValuePage() {
  const players = await getMinutesValueData();

  // Hydrate zero-minute players from cache (bail after 3s, client handles the rest)
  const zeroMinute = players.filter((p) => p.minutes === 0);
  if (zeroMinute.length > 0) {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));
    try {
      const results = await Promise.race([
        Promise.allSettled(zeroMinute.map((p) => fetchPlayerMinutes(p.playerId))),
        timeout,
      ]);
      zeroMinute.forEach((p, i) => {
        if (results[i].status === "fulfilled") {
          const stats = results[i].value;
          if (stats.minutes > 0) {
            p.minutes = stats.minutes;
            p.totalMatches = stats.appearances || p.totalMatches;
            p.goals = stats.goals;
            p.assists = stats.assists;
          }
        }
      });
    } catch {}
  }

  return <MinutesValueUI initialData={players} />;
}
