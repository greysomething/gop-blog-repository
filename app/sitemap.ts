import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://blog.giftofparenthood.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...(posts ?? []).map((p) => ({
      url: `${SITE_URL}/posts/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
