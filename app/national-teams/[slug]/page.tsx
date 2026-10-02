import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { ManagerClient } from "@/app/components/ManagerClient";
import { DetailDeck } from "@/components/DetailDeck";
import { DetailHero, DetailPageShell } from "@/components/DetailHero";
import { EmptyNote } from "@/components/EmptyNote";
import { HeroMetric } from "@/components/HeroMetric";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/lib/constants";
import { formatMarketValue, formatSignedPercent, formatValuePerPlayer } from "@/lib/format";
import { createPageMetadata } from "@/lib/metadata";
import { getNationalTeamDetail } from "@/lib/national-teams";
import { absoluteUrl } from "@/lib/site-config";
import { flagUrl } from "@/lib/transfermarkt/image";
import { NationPlayers } from "./NationPlayers";
import { NationsLeagueBadge } from "./NationsLeagueBadge";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const data = await getNationalTeamDetail(slug);
  const path = `/national-teams/${slug}`;
  if (!data) {
    return createPageMetadata({
      title: "National Team",
      description: "A national team's squad, market value and value ranking.",
      path,
      noIndex: true,
    });
  }

  const { team, ranks, confederation } = data;
  return createPageMetadata({
    title: `${team.name} National Team: Squad, Market Value & Ranking`,
    description: `${team.name}'s call-up is worth ${formatMarketValue(team.totalValue)}, ${formatValuePerPlayer(team.averageValue)} per player: #${ranks.world} of ${data.nations} national teams${ranks.confederation ? ` and #${ranks.confederation} in ${confederation}` : ""}. The squad, and the players outside it who could be picked.`,
    path,
    keywords: [
      `${team.name} national team`,
      `${team.name} squad`,
      `${team.name} market value`,
      `${team.name} squad value`,
      `${team.name} players`,
      "national team ranking",
    ],
  });
}

export default async function NationalTeamPage({ params }: Params) {
  const { slug } = await params;
  const data = await getNationalTeamDetail(slug);
  if (!data) notFound();

  const { team, ranks, confederation, titles, callUp, outsiders, extended, callUpGap } = data;
  const flag = flagUrl(String(team.landId));
  const gap = callUpGap === null ? null : Math.round(callUpGap * 100);
  const pageUrl = absoluteUrl(`/national-teams/${slug}`);
  const tmUrl = `${BASE_URL}/x/startseite/verein/${team.id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${team.name} national team squad and market value`,
        description: `${team.name}'s call-up, extended squad and value ranking.`,
        mainEntity: { "@id": `${pageUrl}#team` },
      },
      {
        "@type": "SportsTeam",
        "@id": `${pageUrl}#team`,
        name: `${team.name} national football team`,
        url: pageUrl,
        sport: "Association football",
        logo: flag,
        image: flag,
        sameAs: tmUrl,
        ...(confederation && {
          memberOf: { "@type": "SportsOrganization", name: confederation },
        }),
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Squad market value",
            value: formatMarketValue(team.totalValue),
          },
          {
            "@type": "PropertyValue",
            name: "Value per player",
            value: formatValuePerPlayer(team.averageValue),
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "National teams",
            item: absoluteUrl("/national-teams"),
          },
          { "@type": "ListItem", position: 2, name: team.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <DetailPageShell backHref="/national-teams" backLabel="Back to national teams">
      <JsonLd data={jsonLd} />
      <DetailHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[1.5rem] border border-border-medium bg-white p-3 sm:h-28 sm:w-28">
            <img src={flag} alt={`${team.name} flag`} className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 empty:hidden">
              {confederation && <Badge variant="secondary">{confederation}</Badge>}
              <Suspense>
                <NationsLeagueBadge teamId={team.id} />
              </Suspense>
            </div>

            <h1 className="mt-4 text-3xl font-pixel leading-tight text-text-primary sm:text-4xl">
              {team.name}
            </h1>

            {titles.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                {titles.map((t) => (
                  <span key={t.name}>
                    <span className="font-value text-text-primary">{t.count}×</span> {t.name}
                  </span>
                ))}
              </p>
            )}

            <ManagerClient clubId={team.id} national />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                asChild
                variant="outline"
                className="border-border-medium bg-elevated text-text-primary hover:bg-card-hover"
              >
                <a href={tmUrl} target="_blank" rel="noopener noreferrer">
                  Transfermarkt
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Both squads ranked on value per player, the call-up's as the National Teams
            table ranks it, each over the figure it ranks; then which of the two is worth
            more a head, which says whether the call-up picked the pick of the pool. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <HeroMetric
            label="Value rank"
            value={`#${ranks.world}`}
            subline={
              <>
                <span className="font-value text-accent-gold">
                  {formatValuePerPlayer(team.averageValue)}
                </span>{" "}
                per player{ranks.confederation && ` · #${ranks.confederation} in ${confederation}`}
              </>
            }
            accentClass="text-text-primary"
          />
          {extended &&
            (ranks.extended ? (
              <HeroMetric
                label="Extended squad rank"
                value={`#${ranks.extended.place}`}
                subline={
                  <>
                    <span className="font-value">{formatValuePerPlayer(extended.perPlayer)}</span>{" "}
                    per player · of the {ranks.extended.of} most valuable
                  </>
                }
                accentClass="text-text-primary"
              />
            ) : (
              <HeroMetric
                label="Extended squad"
                value={formatValuePerPlayer(extended.perPlayer)}
                subline={`per player, across ${extended.players}`}
                accentClass="text-text-primary"
              />
            ))}
          {gap !== null && (
            <HeroMetric
              label="Call-up gap"
              value={formatSignedPercent(callUpGap!)}
              subline={`${gap > 0 ? "above" : gap < 0 ? "below" : "level with"} the extended squad, per player`}
              accentClass={
                gap > 0
                  ? "text-accent-hot"
                  : gap < 0
                    ? "text-accent-cold-soft"
                    : "text-text-primary"
              }
            />
          )}
        </div>
      </DetailHero>

      {callUp ? (
        <DetailDeck
          sections={[
            { value: "squad", label: "Squad" },
            ...(outsiders.length > 0 ? [{ value: "outsiders", label: "Outside the squad" }] : []),
          ]}
        >
          <div className="space-y-4">
            <p className="max-w-3xl text-sm text-text-secondary">
              The players {team.name} has called up now. Caps and international goals are for{" "}
              {team.name}; npG+A and minutes are this season, for the players we track.
            </p>
            <NationPlayers players={callUp} nation={team.name} />
          </div>
          {outsiders.length > 0 && (
            <div className="space-y-4">
              <p className="max-w-3xl text-sm text-text-secondary">
                Everyone else {team.name} could pick: the rest of its extended squad, and the
                players we track with {team.name} nationality, first or second, who aren&apos;t
                capped by another nation. Beside each value: where it would rank in the call-up, and
                when the player was last picked, if ever.
              </p>
              <NationPlayers players={outsiders} nation={team.name} />
            </div>
          )}
        </DetailDeck>
      ) : (
        <div className="mt-8">
          <EmptyNote>
            Transfermarkt didn&apos;t return {team.name}&apos;s squad just now. Try again in a
            while.
          </EmptyNote>
        </div>
      )}
    </DetailPageShell>
  );
}
