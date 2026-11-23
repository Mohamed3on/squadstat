/**
 * A strip of equal cells, one per unit, filled segment by segment: a count read at a glance.
 * Past `max` units each cell stands for a share instead, and a non-zero segment keeps at least
 * one cell so it never vanishes. Decorative; the figures beside it carry the numbers.
 */
export function CellBar({
  segments,
  max = 40,
}: {
  segments: { count: number; className: string }[];
  max?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const scale = total > max ? max / total : 1;
  const cells = segments.flatMap(({ count, className }) =>
    Array.from<string>({ length: count > 0 ? Math.max(1, Math.round(count * scale)) : 0 }).fill(
      className,
    ),
  );

  return (
    <div aria-hidden className={`flex h-2 ${cells.length > 20 ? "gap-px" : "gap-0.5"}`}>
      {cells.map((className, i) => (
        <span key={i} className={`flex-1 rounded-xs ${className}`} />
      ))}
    </div>
  );
}
