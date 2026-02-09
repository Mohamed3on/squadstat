export type PositionClass = "cf" | "forward" | "attacking-midfield" | "central-midfield" | "other";

const POSITION_CLASS_MAP: Record<string, PositionClass> = {
  "Centre-Forward": "cf",
  "Left Winger": "forward",
  "Right Winger": "forward",
  "Second Striker": "forward",
  "Attacking Midfield": "attacking-midfield",
  "Central Midfield": "central-midfield",
};
const POSITION_CLASS_RANK: Record<PositionClass, number> = {
  other: 1,
  "central-midfield": 2,
  "attacking-midfield": 3,
  forward: 4,
  cf: 5,
};
const DEFENSIVE_POSITIONS = new Set<string>([
  "Goalkeeper",
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Defensive Midfield",
  "Left Wing-Back",
  "Right Wing-Back",
]);

export function getPositionClass(position: string): PositionClass {
  return POSITION_CLASS_MAP[position] ?? "other";
}

export function getPositionClassRank(position: string): number {
  return POSITION_CLASS_RANK[getPositionClass(position)];
}

export function canBeUnderperformerAgainst(candidatePosition: string, targetPosition: string): boolean {
  if (isDefensivePosition(candidatePosition) && !isDefensivePosition(targetPosition)) {
    return false;
  }
  return getPositionClassRank(candidatePosition) >= getPositionClassRank(targetPosition);
}

export function canBeOutperformerAgainst(candidatePosition: string, targetPosition: string): boolean {
  return getPositionClassRank(candidatePosition) <= getPositionClassRank(targetPosition);
}

export function isDefensivePosition(position: string): boolean {
  return DEFENSIVE_POSITIONS.has(position);
}
