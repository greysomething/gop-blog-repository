import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createClient();
  const query = supabase
    .from("posts")
    .select("id, slug, title, status, confidence_score, published_at, created_at, auto_published")
    .order("created_at", { ascending: false })
    .limit(100);
  if (searchParams.status) query.eq("status", searchParams.status);

  const { data: posts } = await query;

  const statuses = ["all", "draft", "scored", "queued", "published", "archived", "rejected"];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Posts</h1>
      <div className="flex gap-2 mb-4 text-sm">
        {statuses.map((s) => {
          const active = (searchParams.status ?? "all") === s;
          const href = s === "all" ? "/admin/posts" : `/admin/posts?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`rounded px-2 py-1 ${active ? "bg-slate-900 text-white" : "bg-slate-100"}`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Score</th>
              <th className="p-3">Published</th>
              <th className="p-3">Auto?</th>
            </tr>
          </thead>
          <tbody>
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <Link href={`/admin/posts/${p.id}`} className="hover:underline font-medium">
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{p.status}</Badge>
                </td>
                <td className="p-3">{p.confidence_score ?? "—"}</td>
                <td className="p-3">{p.published_at ? formatDate(p.published_at) : "—"}</td>
                <td className="p-3">{p.auto_published ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts?.length && <div className="p-6 text-muted-foreground">No posts.</div>}
      </div>
    </div>
  );
}
