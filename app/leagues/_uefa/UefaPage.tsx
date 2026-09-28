import { getTeamDetailHref } from "@/lib/format";
import { getNationalTeamValues } from "@/lib/squad-values";
import { getClubIdsWithPages } from "@/lib/team-detail";
import { flagUrl } from "@/lib/transfermarkt/image";
import { getCompClubs, getCompSeason, getNationsSeason } from "@/lib/uefa/fetch";
import { buildModel } from "@/lib/uefa/model";
import { buildNationsModel } from "@/lib/uefa/nations-league";
import type { Competition, GroupsComp, LeaguePhaseComp } from "@/lib/uefa/types";
import { playerLinks } from "@/lib/wc/linkable-nations";
import { TeamsProvider, UefaBody } from "./UefaBody";

/** The whole page body for every UEFA competition — only the metadata in each
 *  route's page.tsx differs. */
export async function UefaPage({ comp }: { comp: Competition }) {
  const { view, links, badges } =
    comp.format === "league" ? await clubPage(comp) : await nationPage(comp);
  return (
    <div className="py-6 sm:py-10">
      <TeamsProvider links={links} badges={badges}>
        <UefaBody comp={comp} view={view} />
      </TeamsProvider>
    </div>
  );
}

/** Clubs wear their crest and link to their /teams page where the site has one. */
async function clubPage(comp: LeaguePhaseComp) {
  const [clubs, season, withPages] = await Promise.all([
    getCompClubs(comp.code),
    getCompSeason(comp.code),
    getClubIdsWithPages(),
  ]);
  return {
    view: buildModel(clubs, season),
    links: Object.fromEntries(
      clubs.filter((c) => withPages.has(c.id)).map((c) => [c.id, getTeamDetailHref(c.id)]),
    ),
    badges: undefined,
  };
}

/** Nations take their value per player from the committed national-team data — the
 *  figure /national-teams shows — link to their players, and wear their flag. */
async function nationPage(comp: GroupsComp) {
  const values = getNationalTeamValues();
  const [{ teams }, season, players] = await Promise.all([
    values,
    getNationsSeason(comp.code),
    values.then(({ teams }) => playerLinks(teams)),
  ]);
  const inPlay = new Set(season.table.map((r) => r.id));
  const nations = teams.filter((t) => inPlay.has(t.id));
  return {
    view: buildNationsModel(
      nations.map((t) => ({
        id: t.id,
        name: t.name,
        squad: t.squadSize,
        avgAge: t.averageAge,
        mv: t.averageValue / 1_000_000,
      })),
      season,
      comp.bands,
    ),
    links: Object.fromEntries(
      nations.filter((t) => players[t.name]).map((t) => [t.id, players[t.name]]),
    ),
    badges: Object.fromEntries(nations.map((t) => [t.id, flagUrl(String(t.landId))])),
  };
}
