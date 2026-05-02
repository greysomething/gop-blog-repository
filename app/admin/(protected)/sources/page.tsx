import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const supabase = createClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .order("trust_tier", { ascending: true })
    .order("name", { ascending: true });

  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  let activeCount = 0;
  for (const s of sources ?? []) {
    tierCounts[s.trust_tier] = (tierCounts[s.trust_tier] ?? 0) + 1;
    if (s.is_active) activeCount++;
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sources?.length ?? 0} total · {activeCount} active · Tier 1: {tierCounts[1]} ·
            Tier 2: {tierCounts[2]} · Tier 3: {tierCounts[3]}
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/admin/sources/new">
            <Plus className="w-4 h-4 mr-1" />
            New source
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Click any row to edit. Tier 1 = peer-reviewed / gov / clinical guidelines. Tier 2 =
        patient nonprofits / trade orgs. Tier 3 = journalism &amp; clinic blogs (topic mining
        only — never cited as primary source).
      </p>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Type</th>
              <th className="p-3">Active</th>
              <th className="p-3">Last crawled</th>
              <th className="p-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {(sources ?? []).map((s) => (
              <tr key={s.id} className="border-t align-top hover:bg-slate-50">
                <td className="p-3">
                  <Link href={`/admin/sources/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                  <div className="text-xs text-muted-foreground break-all">
                    {s.feed_url ?? s.url}
                  </div>
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      s.trust_tier === 1
                        ? "success"
                        : s.trust_tier === 2
                          ? "secondary"
                          : "outline"
                    }
                  >
                    Tier {s.trust_tier}
                  </Badge>
                </td>
                <td className="p-3">{s.source_type}</td>
                <td className="p-3">
                  {s.is_active ? (
                    <Badge variant="success">Yes</Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </td>
                <td className="p-3 text-muted-foreground text-xs">
                  {s.last_crawled_at ? formatDate(s.last_crawled_at) : "—"}
                </td>
                <td className="p-3 text-xs text-red-600 max-w-xs truncate">
                  {s.crawl_notes ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sources?.length && <div className="p-6 text-muted-foreground">No sources yet.</div>}
      </div>
    </div>
  );
}
