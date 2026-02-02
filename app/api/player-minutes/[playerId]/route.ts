import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const BASE_URL = "https://www.transfermarkt.com";

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    next: { revalidate: 43200 }, // Cache for 12 hours
  });
  return response.text();
}

async function fetchPlayerMinutes(playerId: string): Promise<number> {
  if (!playerId) return 0;
  try {
    const url = `${BASE_URL}/x/leistungsdaten/spieler/${playerId}`;
    const htmlContent = await fetchPage(url);
    const $ = cheerio.load(htmlContent);
    const minutesText = $("table.items tfoot tr td.rechts").last().text().trim();
    const cleaned = minutesText.replace(/[.']/g, "").replace(/,/g, "");
    return parseInt(cleaned) || 0;
  } catch (err) {
    console.error(`Error fetching minutes for player ${playerId}:`, err);
    return 0;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  if (!playerId) {
    return NextResponse.json({ error: "Player ID is required" }, { status: 400 });
  }

  try {
    const minutes = await fetchPlayerMinutes(playerId);
    return NextResponse.json({ playerId, minutes });
  } catch (error) {
    console.error("Error fetching player minutes:", error);
    return NextResponse.json({ error: "Failed to fetch player minutes" }, { status: 500 });
  }
}
