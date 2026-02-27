export interface LinkMetadata {
  title: string;
  description: string;
}

function extractTagContent(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

export async function fetchMetadataFromUrl(url: string): Promise<LinkMetadata> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "notice-web/0.1",
      },
    });

    if (!response.ok) {
      return { title: "", description: "" };
    }

    const html = await response.text();
    const title =
      extractTagContent(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      extractTagContent(html, /<title[^>]*>([^<]+)<\/title>/i);
    const description =
      extractTagContent(
        html,
        /<meta\s+(?:name=["']description["']|property=["']og:description["'])\s+content=["']([^"']+)["']/i
      ) || "";

    return { title, description };
  } catch {
    return { title: "", description: "" };
  }
}