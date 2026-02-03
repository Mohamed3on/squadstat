export function parseMarketValue(value: string): number {
  if (!value || value === "-") return 0;
  const cleaned = value.replace(/[€,]/g, "").trim();
  const match = cleaned.match(/([\d.]+)(k|m|bn)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || "").toLowerCase();
  if (unit === "bn") return num * 1_000_000_000;
  if (unit === "m") return num * 1_000_000;
  if (unit === "k") return num * 1_000;
  return num;
}
