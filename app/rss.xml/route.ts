import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.giftofparenthood.org";

export const revalidate = 600;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, title, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const items = (posts ?? [])
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/posts/${p.slug}</link>
      <guid>${SITE_URL}/posts/${p.slug}</guid>
      <pubDate>${new Date(p.published_at ?? Date.now()).toUTCString()}</pubDate>
      <description>${escapeXml(p.excerpt ?? "")}</description>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Gift of Parenthood Blog</title>
    <link>${SITE_URL}</link>
    <description>Evidence-based articles on fertility, adoption, surrogacy, and family building.</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
