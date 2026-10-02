import { formatSignedPercent, formatValuePerPlayer } from "@/lib/format";
import { getNationalTeamDetail } from "@/lib/national-teams";
import { createEntityOgImage, OG_CONTENT_TYPE, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "SquadStat national team report";
export const size = OG_IMAGE_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getNationalTeamDetail(slug);

  if (!data) {
    return createEntityOgImage({
      badge: "National team",
      title: "National team report",
      subtitle: "Squad value, value per player and the players outside the squad.",
      accent: "#ffd700",
      metrics: [],
      imageAlt: "National team report",
    });
  }

  const { team, ranks, confederation, extended, callUpGap } = data;

  return createEntityOgImage({
    badge: "National team",
    title: team.name,
    subtitle: `${confederation ? `${confederation} · ` : ""}Squad, value and the players outside it`,
    accent: "#ffd700",
    primaryImage: team.flagUrl,
    imageAlt: team.name,
    metrics: [
      {
        label: "Value rank",
        value: `#${ranks.world}`,
        detail: `${formatValuePerPlayer(team.averageValue)} per player${ranks.confederation ? ` · #${ranks.confederation} in ${confederation}` : ""}`,
      },
      ...(extended
        ? [
            ranks.extended
              ? {
                  label: "Extended squad rank",
                  value: `#${ranks.extended.place}`,
                  detail: `${formatValuePerPlayer(extended.perPlayer)} per player`,
                }
              : {
                  label: "Extended squad",
                  value: formatValuePerPlayer(extended.perPlayer),
                  detail: `per player, across ${extended.players}`,
                },
          ]
        : []),
      ...(callUpGap !== null
        ? [
            {
              label: "Call-up gap",
              value: formatSignedPercent(callUpGap),
              detail: "vs the extended squad, per player",
            },
          ]
        : []),
    ],
  });
}
