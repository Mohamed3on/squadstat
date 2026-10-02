import * as cheerio from "cheerio";
import { tmImage } from "./image";

/** One title a national team has won, as its data-header counts it. */
export interface NationTitle {
  /** Transfermarkt's own wording — "World Cup winner", "European Champion". */
  name: string;
  count: number;
  /** The trophy itself, as Transfermarkt draws it. */
  imageUrl: string;
}

/** What a national team's data-header carries that its pages share. */
export interface NationHeader {
  /** "UEFA", "CONMEBOL", … — "" when the header has none. */
  confederation: string;
  titles: NationTitle[];
}

/** The one confederation TM spells out rather than abbreviates. */
const CONFEDERATION: Record<string, string> = {
  "South American Football Confederation": "CONMEBOL",
};

/** Parse the data-header every `/verein/{id}` page of a national team carries. */
export function parseNationHeader(html: string): NationHeader {
  const $ = cheerio.load(html);
  const label = (name: string) =>
    $("li.data-header__label")
      .filter((_, li) => $(li).text().trim().startsWith(`${name}:`))
      .find(".data-header__content")
      .first()
      .text()
      .trim();
  const confederation = label("Confederation");

  return {
    confederation: CONFEDERATION[confederation] ?? confederation,
    titles: $("a.data-header__success-data")
      .map((_, a) => ({
        name: $(a).attr("title")?.trim() ?? "",
        count: Number($(a).find(".data-header__success-number").text().trim()) || 1,
        // Lazy-loaded: `src` is a placeholder until the page's script swaps it.
        imageUrl: tmImage($(a).find("img").attr("data-src") || $(a).find("img").attr("src") || ""),
      }))
      .get()
      .filter((t) => t.name),
  };
}
