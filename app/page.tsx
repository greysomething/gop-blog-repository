import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, subtitle, excerpt, cover_image_url, published_at, auto_published")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(24);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Gift of Parenthood Blog
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Evidence-based articles on fertility, adoption, surrogacy, LGBTQ+ family building, and
          the grants and financing that help make it possible.
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <p className="text-muted-foreground">No articles published yet. Check back soon.</p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/posts/${p.slug}`}
              className="group block rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              {p.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.cover_image_url}
                  alt=""
                  className="w-full aspect-[16/9] object-cover"
                />
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold group-hover:text-orange-600 transition-colors">
                  {p.title}
                </h2>
                {p.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.published_at ? formatDate(p.published_at) : ""}</span>
                  {p.auto_published && <Badge variant="brand">AI-assisted</Badge>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
