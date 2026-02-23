const DEFAULT_SITE_URL = "https://squadstat.com";

function normalizeSiteUrl(rawUrl?: string): string {
  if (!rawUrl) return DEFAULT_SITE_URL;

  const trimmed = rawUrl.trim();
  if (!trimmed) return DEFAULT_SITE_URL;

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL);
}

export function getSiteOrigin(): string {
  return new URL(getSiteUrl()).origin;
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${getSiteOrigin()}/`).toString();
}

export const SITE_NAME = "SquadStat";
