/** Start a run of the data workflow (CONTEXT.md), re-fetching every player, as the refresh
 *  of a page showing committed data does. Its concurrency group queues runs rather than
 *  stacking them. */
export async function startDataWorkflow() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not configured");

  const res = await fetch(
    "https://api.github.com/repos/Mohamed3on/squadstat/actions/workflows/refresh-squadstat-data.yml/dispatches",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        // GitHub 403s requests without one, and a Worker's fetch, unlike Node's, sends none.
        "User-Agent": "squadstat",
      },
      body: JSON.stringify({ ref: "main", inputs: { force_refresh: "true" } }),
    },
  );
  if (!res.ok) throw new Error(`GitHub dispatch failed: ${res.status} ${await res.text()}`);
}
