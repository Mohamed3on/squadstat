export const PROFIL_RE = /\/profil\//;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatReturnInfo(dateStr: string): { label: string; imminent: boolean } | null {
  if (!dateStr) return null;
  const [d, m, y] = dateStr.split("/").map(Number);
  if (!d || !m || !y) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  const mon = MONTHS[m - 1];
  if (days <= 0) return { label: `${mon} ${d}`, imminent: true };
  if (days <= 14) return { label: `${days}d`, imminent: true };
  if (days <= 60) return { label: `~${Math.ceil(days / 7)}w`, imminent: false };
  return { label: `${mon} ${d}`, imminent: false };
}
