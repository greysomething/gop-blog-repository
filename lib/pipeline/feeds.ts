import { XMLParser } from "fast-xml-parser";

export interface FeedItem {
  title: string;
  url: string;
  excerpt?: string;
  published_at?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

function asArray<T>(x: T | T[] | undefined): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchFeed(
  feedUrl: string,
  sourceType: "rss" | "sitemap" | "scrape",
): Promise<FeedItem[]> {
  if (sourceType === "scrape") return []; // scrape handled by caller per-source if needed
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "GOP-Blog-Research/1.0 (+https://blog.giftofparenthood.org)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Feed ${feedUrl} → ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);

  if (sourceType === "rss") {
    const items = asArray<Record<string, unknown>>(
      (doc?.rss?.channel?.item as Record<string, unknown> | Record<string, unknown>[]) ??
        (doc?.feed?.entry as Record<string, unknown> | Record<string, unknown>[]),
    );
    return items
      .map((item) => {
        const title = String(item.title ?? "").trim();
        const linkRaw = item.link as string | { "@_href"?: string } | Array<string | { "@_href"?: string }>;
        const link = Array.isArray(linkRaw)
          ? (typeof linkRaw[0] === "string" ? linkRaw[0] : linkRaw[0]?.["@_href"]) ?? ""
          : typeof linkRaw === "string"
            ? linkRaw
            : (linkRaw?.["@_href"] ?? "");
        const desc = stripHtml(
          String(item.description ?? item.summary ?? item["content:encoded"] ?? ""),
        ).slice(0, 800);
        const pub = String(item.pubDate ?? item.published ?? item.updated ?? "");
        return {
          title,
          url: String(link),
          excerpt: desc || undefined,
          published_at: pub || undefined,
        };
      })
      .filter((i) => i.url && i.title);
  }

  if (sourceType === "sitemap") {
    const urls = asArray<Record<string, unknown>>(doc?.urlset?.url);
    return urls
      .map((u) => ({
        title: String(u.loc ?? "").split("/").filter(Boolean).slice(-1)[0] ?? String(u.loc ?? ""),
        url: String(u.loc ?? ""),
        published_at: String(u.lastmod ?? "") || undefined,
      }))
      .filter((i) => i.url);
  }

  return [];
}
