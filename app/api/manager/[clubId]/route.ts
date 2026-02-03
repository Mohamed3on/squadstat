import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import type { ManagerInfo } from "@/app/types";

const BASE_URL = "https://www.transfermarkt.com";

async function fetchManagerInfo(clubId: string): Promise<ManagerInfo | null> {
  try {
    // The staff page URL redirects properly even with a placeholder slug
    const staffUrl = `${BASE_URL}/placeholder/mitarbeiter/verein/${clubId}`;
    const response = await fetch(staffUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      next: { revalidate: 3600 }, // 1 hour cache
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find the coaching staff table and look for "Manager" position
    const rows = $(".responsive-table table tbody tr");

    for (let i = 0; i < rows.length; i++) {
      const row = $(rows[i]);
      const inlineTable = row.find(".inline-table");
      const position = inlineTable.find("tr:last-child td").text().trim();

      if (position === "Manager" || position === "Head Coach") {
        const link = inlineTable.find(".hauptlink a");
        const name = link.attr("title") || link.text().trim();
        const profileUrl = link.attr("href") || "";
        const cells = row.find("> td");
        const appointedDate = $(cells[3]).text().trim();

        if (name) {
          return {
            name,
            profileUrl: profileUrl.startsWith("/") ? BASE_URL + profileUrl : profileUrl,
            appointedDate: appointedDate || undefined,
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error(`Error fetching manager for club ${clubId}:`, err);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const manager = await fetchManagerInfo(clubId);
  return NextResponse.json({ clubId, manager });
}
