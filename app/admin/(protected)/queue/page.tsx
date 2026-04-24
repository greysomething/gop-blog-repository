import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("review_queue")
    .select("id, reason, created_at, reviewed_at, decision, post:posts(id, title, confidence_score, rubric)")
    .is("reviewed_at", null)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Review queue</h1>
      {!items?.length ? (
        <p className="text-muted-foreground">Nothing to review. 👍</p>
      ) : (
        <div className="space-y-3">
          {items.map((q) => (
            <Link
              key={q.id}
              href={`/admin/queue/${q.id}`}
              className="block rounded-lg border p-4 hover:shadow-sm transition-shadow bg-card"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">
                    {/* @ts-expect-error relation shape */}
                    {q.post?.title ?? "(missing post)"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{q.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  {/* @ts-expect-error relation shape */}
                  {q.post?.confidence_score != null && (
                    <Badge variant="secondary">
                      {/* @ts-expect-error relation shape */}
                      {q.post.confidence_score}%
                    </Badge>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatDate(q.created_at)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
