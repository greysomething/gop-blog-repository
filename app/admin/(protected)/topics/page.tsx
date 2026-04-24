import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const supabase = createClient();
  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, summary, status, medical_legal_flag, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Topics</h1>
      <div className="space-y-3">
        {(topics ?? []).map((t) => (
          <div key={t.id} className="rounded-lg border bg-card p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{t.summary}</div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <Badge variant="secondary">{t.status}</Badge>
                {t.medical_legal_flag && <Badge variant="warning">med/legal</Badge>}
                <div className="text-xs text-muted-foreground">{formatDate(t.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
        {!topics?.length && <p className="text-muted-foreground">No topics yet.</p>}
      </div>
    </div>
  );
}
