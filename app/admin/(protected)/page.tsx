import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = createClient();

  const [
    { count: queued },
    { count: drafts },
    { count: published },
    { count: topicsProposed },
    { data: recentRuns },
  ] = await Promise.all([
    supabase.from("review_queue").select("*", { count: "exact", head: true }).is("reviewed_at", null),
    supabase.from("posts").select("*", { count: "exact", head: true }).in("status", ["draft", "scored"]),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("topics").select("*", { count: "exact", head: true }).eq("status", "proposed"),
    supabase
      .from("pipeline_runs")
      .select("id, stage, status, created_at, error, output")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Stat label="Awaiting review" value={queued ?? 0} href="/admin/queue" tone="amber" />
        <Stat label="Drafts in flight" value={drafts ?? 0} href="/admin/posts?status=draft" />
        <Stat label="Published" value={published ?? 0} href="/admin/posts?status=published" />
        <Stat label="Proposed topics" value={topicsProposed ?? 0} href="/admin/topics" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent pipeline runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(recentRuns ?? []).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between text-sm border-b last:border-0 py-2"
            >
              <div className="flex items-center gap-3">
                <Badge variant={r.status === "success" ? "success" : r.status === "error" ? "destructive" : "secondary"}>
                  {r.stage}
                </Badge>
                <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <div className="text-muted-foreground text-xs max-w-md truncate">
                {r.error ?? JSON.stringify(r.output ?? {})}
              </div>
            </div>
          ))}
          {!recentRuns?.length && (
            <p className="text-sm text-muted-foreground">No runs yet. Crons will begin on deploy.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone?: "amber";
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-4 hover:shadow-sm transition-shadow ${
        tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-card"
      }`}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </Link>
  );
}
