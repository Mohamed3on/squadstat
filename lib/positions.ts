import type { MinutesValuePlayer } from "@/app/types";

export type PositionType = "all" | "forward" | "cf" | "non-forward";

export const FORWARD_POSITIONS = ["Centre-Forward", "Left Winger", "Right Winger", "Second Striker"] as const;

export const POSITION_MAP: Record<Exclude<PositionType, "all" | "non-forward">, readonly string[]> = {
  forward: FORWARD_POSITIONS,
  cf: ["Centre-Forward"],
};

const POSITION_ALIASES: Record<string, PositionType> = {
  midfielder: "non-forward",
};

const FORWARD_POSITION_SET = new Set<string>(FORWARD_POSITIONS);

export function isForwardPosition(position: string): boolean {
  return FORWARD_POSITION_SET.has(position);
}

export function resolvePositionType(
  rawPosition: string | null,
  {
    defaultValue,
    allowed,
  }: {
    defaultValue: PositionType;
    allowed: readonly PositionType[];
  }
): PositionType | null {
  const normalized = rawPosition?.trim().toLowerCase();
  if (!normalized) return defaultValue;

  const resolved = POSITION_ALIASES[normalized] ?? normalized;
  if (!allowed.includes(resolved as PositionType)) return null;
  return resolved as PositionType;
}

export function filterByPosition(
  players: MinutesValuePlayer[],
  positionType: PositionType
): MinutesValuePlayer[] {
  if (positionType === "all") return players;
  if (positionType === "non-forward") {
    return players.filter((p) => !isForwardPosition(p.position));
  }

  const positions = POSITION_MAP[positionType];
  return players.filter((p) => positions.includes(p.position));
}
