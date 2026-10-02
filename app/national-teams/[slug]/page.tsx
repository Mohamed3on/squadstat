import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Suspense, type CSSProperties } from "react";
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
import { CALL_UP_STATUS, CALL_UP_STATUSES } from "./status";

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

/** Two values a head on one scale, the call-up's in gold: which is worth more, at a
 *  glance, with each figure printed so the bars are never the only telling. */
function ValueBars({ bars }: { bars: { label: string; value: number; fill: string }[] }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className="mt-2.5 space-y-1.5">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2 text-[10px]">
          <span className="w-12 shrink-0 text-text-muted">{b.label}</span>
          <div className="h-1.5 flex-1 rounded-r bg-elevated">
            <div
              className={`animate-bar-fill h-full rounded-r ${b.fill}`}
              style={{ "--bar-width": `${(b.value / max) * 100}%` } as CSSProperties}
            />
          </div>
          <span className="w-14 shrink-0 text-right font-value text-text-secondary">
            {formatValuePerPlayer(b.value)}
          </span>
        </div>
      ))}
    </div>
  );
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

            {/* Each title as its trophy, with how many: the names ride in the tooltip. */}
            {titles.length > 0 && (
              <ul
                className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1"
                aria-label="Titles"
              >
                {titles.map((t) => (
                  <li
                    key={t.name}
                    title={`${t.count}× ${t.name}`}
                    className="inline-flex items-center gap-1"
                  >
                    {t.imageUrl && <img src={t.imageUrl} alt="" className="h-6 w-auto" />}
                    <span className="font-value text-xs text-text-secondary">×{t.count}</span>
                    <span className="sr-only">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}

            <ManagerClient clubId={team.id} />

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
            table ranks it; then the two values side by side, which says at a glance
            whether the call-up picked the pick of the group. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <HeroMetric
            label="Call-up rank"
            value={`#${ranks.world}`}
            subline={`of ${data.nations}${ranks.confederation ? ` · #${ranks.confederation} in ${confederation}` : ""}`}
            accentClass="text-text-primary"
          />
          {extended &&
            (ranks.extended ? (
              <HeroMetric
                label="Extended rank"
                value={`#${ranks.extended.place}`}
                subline={`of the top ${ranks.extended.of}`}
                accentClass="text-text-primary"
              />
            ) : (
              <HeroMetric
                label="Extended squad"
                value={formatValuePerPlayer(extended.perPlayer)}
                subline={`a head, across ${extended.players}`}
                accentClass="text-text-primary"
              />
            ))}
          {gap !== null && extended && (
            <div className="col-span-2 sm:col-span-1">
              <HeroMetric
                label="Call-up gap"
                value={formatSignedPercent(callUpGap!)}
                accentClass={
                  gap > 0
                    ? "text-accent-hot"
                    : gap < 0
                      ? "text-accent-cold-soft"
                      : "text-text-primary"
                }
              >
                <ValueBars
                  bars={[
                    { label: "Call-up", value: team.averageValue, fill: "bg-accent-gold" },
                    { label: "Extended", value: extended.perPlayer, fill: "bg-text-muted" },
                  ]}
                />
              </HeroMetric>
            </div>
          )}
        </div>
      </DetailHero>

      {callUp ? (
        <DetailDeck
          sections={[
            { value: "squad", label: "Squad", count: callUp.length },
            ...(outsiders.length > 0
              ? [{ value: "outsiders", label: "Outside the squad", count: outsiders.length }]
              : []),
          ]}
        >
          <NationPlayers players={callUp} nation={team.name} nationFlagUrl={flag} />
          {outsiders.length > 0 && (
            <div className="space-y-4">
              {/* The legend: how lately each outsider was picked, and how many are each. */}
              <ul className="flex flex-wrap items-center gap-2">
                {CALL_UP_STATUSES.map((s) => {
                  const n = outsiders.filter((p) => p.status === s).length;
                  const { label, Icon, chip } = CALL_UP_STATUS[s];
                  return (
                    n > 0 && (
                      <li
                        key={s}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${chip}`}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {label}
                        <span className="font-value">{n}</span>
                      </li>
                    )
                  );
                })}
                <li className="text-xs text-text-muted sm:hidden">
                  <span className="font-value text-text-secondary">8th</span>: where he&apos;d rank
                  in the call-up
                </li>
              </ul>
              <NationPlayers players={outsiders} nation={team.name} nationFlagUrl={flag} />
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
