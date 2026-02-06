import type { Metadata } from "next";
import { getMinutesValueData } from "@/lib/fetch-minutes-value";
import { fetchPlayerMinutes } from "@/lib/fetch-player-minutes";
import { MinutesValueUI } from "./MinutesValueUI";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Benched Stars | FormTracker",
  description:
    "High-value football players getting the fewest minutes across Europe's top leagues.",
};

export default async function MinutesValuePage() {
  const players = await getMinutesValueData();

  const zeroMinute = players.filter((p) => p.minutes === 0);
  const CONCURRENCY = 25;
  for (let i = 0; i < zeroMinute.length; i += CONCURRENCY) {
    const batch = zeroMinute.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((p) => fetchPlayerMinutes(p.playerId))
    );
    batch.forEach((p, j) => {
      if (results[j].status === "fulfilled" && results[j].value.minutes > 0) {
        const s = results[j].value;
        p.minutes = s.minutes;
        p.totalMatches = s.appearances || p.totalMatches;
        p.goals = s.goals;
        p.assists = s.assists;
      }
    });
  }

  return <MinutesValueUI initialData={players} />;
}
