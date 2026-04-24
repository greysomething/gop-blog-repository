import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QueueReviewForm } from "@/components/admin/QueueReviewForm";

export const dynamic = "force-dynamic";

export default async function QueueItemPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: q } = await supabase
    .from("review_queue")
    .select("id, reason, notes, post_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!q) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, subtitle, body_md, excerpt, confidence_score, rubric, status")
    .eq("id", q.post_id)
    .single();

  const { data: citations } = await supabase
    .from("citations")
    .select("position, claim, url, source_title, source_tier, verified")
    .eq("post_id", q.post_id)
    .order("position");

  if (!post) notFound();

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <div className="text-sm text-muted-foreground">Review queue</div>
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="text-sm text-amber-700 mt-2">{q.reason}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <QueueReviewForm
          queueId={q.id}
          initial={{
            title: post.title,
            subtitle: post.subtitle ?? "",
            body_md: post.body_md,
          }}
        />

        <aside className="space-y-6">
          <div className="rounded-lg border p-4 bg-card">
            <h3 className="font-semibold mb-2">Rubric</h3>
            <div className="text-sm space-y-1">
              <Row label="Source quality" value={post.rubric?.source_quality} />
              <Row label="Citation coverage" value={post.rubric?.citation_coverage} />
              <Row label="Risk" value={post.rubric?.risk} />
              <Row label="Fact check" value={post.rubric?.fact_check} />
              <Row label="Editorial" value={post.rubric?.editorial} />
              <Row label="Confidence" value={post.confidence_score} strong />
            </div>
            {q.notes && (
              <p className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap">{q.notes}</p>
            )}
          </div>

          <div className="rounded-lg border p-4 bg-card">
            <h3 className="font-semibold mb-3">Citations</h3>
            <ol className="space-y-3 text-sm">
              {(citations ?? []).map((c) => (
                <li key={c.position} className="border-b last:border-0 pb-2">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline break-all"
                  >
                    {c.source_title ?? c.url}
                  </a>
                  <div className="text-xs text-muted-foreground">Tier {c.source_tier}</div>
                  <p className="mt-1 text-muted-foreground">{c.claim}</p>
                </li>
              ))}
              {!citations?.length && (
                <li className="text-muted-foreground">No citations.</li>
              )}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number | null | undefined; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : ""}>{value ?? "—"}</span>
    </div>
  );
}
