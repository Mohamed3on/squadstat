const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export async function fetchPage(url: string, revalidate?: number): Promise<string> {
  const response = await fetch(url, {
    headers: HEADERS,
    ...(revalidate !== undefined && { next: { revalidate } }),
  });
  return response.text();
}
