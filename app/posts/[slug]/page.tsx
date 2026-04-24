import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

async function getPost(slug: string) {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, slug, title, subtitle, body_md, cover_image_url, excerpt, seo_title, seo_description, published_at, auto_published, confidence_score",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!post) return null;

  const { data: citations } = await supabase
    .from("citations")
    .select("claim, url, source_title, source_tier, position")
    .eq("post_id", post.id)
    .order("position", { ascending: true });

  return { post, citations: citations ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getPost(params.slug);
  if (!result) return {};
  const { post } = result;
  return {
    title: post.seo_title ?? post.title,
    description: post.seo_description ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seo_title ?? post.title,
      description: post.seo_description ?? post.excerpt ?? undefined,
      images: post.cover_image_url ? [post.cover_image_url] : [],
      type: "article",
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const result = await getPost(params.slug);
  if (!result) notFound();
  const { post, citations } = result;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">{post.title}</h1>
        {post.subtitle && (
          <p className="text-lg md:text-xl text-muted-foreground mb-4">{post.subtitle}</p>
        )}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          {post.auto_published && <Badge variant="brand">AI-assisted</Badge>}
        </div>
      </header>

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="w-full rounded-lg mb-8 aspect-[16/9] object-cover"
        />
      )}

      <div className="prose prose-slate prose-lg max-w-none prose-a:text-orange-600 prose-headings:tracking-tight">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body_md}</ReactMarkdown>
      </div>

      {citations.length > 0 && (
        <section className="mt-16 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Sources</h2>
          <ol className="space-y-3 text-sm">
            {citations.map((c, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-muted-foreground tabular-nums">{c.position ?? i + 1}.</span>
                <div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    {c.source_title ?? c.url}
                  </a>
                  {c.source_tier && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Tier {c.source_tier}
                    </span>
                  )}
                  <p className="text-muted-foreground mt-1">{c.claim}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer className="mt-12 pt-8 border-t text-sm text-muted-foreground">
        <p>
          This article is for informational purposes and is not medical, legal, or financial
          advice. Please consult a qualified professional about your specific situation.
        </p>
      </footer>
    </article>
  );
}
