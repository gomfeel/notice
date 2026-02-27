function extractTagContent(html, pattern) {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

export async function fetchMetadata(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "notice-bot/0.1",
    },
  });

  const html = await response.text();
  const title =
    extractTagContent(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    extractTagContent(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description =
    extractTagContent(
      html,
      /<meta\s+(?:name=["']description["']|property=["']og:description["'])\s+content=["']([^"']+)["']/i
    ) || "";

  return { url, title, description };
}
