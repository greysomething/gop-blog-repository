import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const supabase = createClient();
  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .order("trust_tier", { ascending: true })
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sources</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Curated inputs for the research stage. Tier 1 = peer-reviewed / gov / clinical guidelines.
        Tier 2 = patient nonprofits / trade orgs. Tier 3 = journalism & clinic blogs (topic mining
        only — never cited).
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
              <tr key={s.id} className="border-t align-top">
                <td className="p-3">
                  <div className="font-medium">{s.name}</div>
                  <a
                    href={s.feed_url ?? s.url}
                    className="text-xs text-muted-foreground hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.feed_url ?? s.url}
                  </a>
                </td>
                <td className="p-3">
                  <Badge variant={s.trust_tier === 1 ? "success" : s.trust_tier === 2 ? "secondary" : "outline"}>
                    Tier {s.trust_tier}
                  </Badge>
                </td>
                <td className="p-3">{s.source_type}</td>
                <td className="p-3">{s.is_active ? "Yes" : "No"}</td>
                <td className="p-3 text-muted-foreground">
                  {s.last_crawled_at ? formatDate(s.last_crawled_at) : "—"}
                </td>
                <td className="p-3 text-xs text-red-600">{s.crawl_notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Edit sources directly in Supabase &mdash; full CRUD UI is a v2 feature.
      </p>
    </div>
  );
}
