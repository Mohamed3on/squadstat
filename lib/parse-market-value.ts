export function parseMarketValue(value: string): number {
  if (!value || value === "-") return 0;
  const cleaned = value.replace(/[€,]/g, "").trim();
  const match = cleaned.match(/([\d.]+)(k|m|bn|b)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "bn" || unit === "b") return num * 1_000_000_000;
  if (unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}

/** Transfermarkt's value text as the site shows it: "€70.00m" → "€70M", "€27.50m" → "€27.5M",
 *  "€1.20bn" → "€1.2B". TM pads every value to two decimals; the site never did. */
export function tidyValueText(value: string): string {
  return value.replace(/€(\d+(?:\.\d+)?)(bn|m|k)\b/gi, (_, num: string, unit: string) => {
    const u = unit.toLowerCase();
    return `€${parseFloat(num)}${u === "bn" ? "B" : u.toUpperCase()}`;
  });
}
