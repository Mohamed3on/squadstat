import { readFile } from "fs/promises";
import { join } from "path";

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export async function DataLastUpdated({ file = "updated-at.txt" }: { file?: string } = {}) {
  let updatedAt: Date;
  try {
    const raw = await readFile(join(process.cwd(), "data", file), "utf-8");
    updatedAt = new Date(raw.trim());
  } catch {
    updatedAt = new Date();
  }

  const formatted = updatedAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-center gap-2 py-6 text-xs tracking-wide uppercase text-text-muted">
      <span className="inline-block size-1.5 rounded-full bg-text-muted" />
      <span>
        Updated {formatted}
        <span className="ml-1.5 text-text-secondary">({timeAgo(updatedAt)})</span>
      </span>
    </div>
  );
}
