import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const supabase = createClient();
  const { data: runs } = await supabase
    .from("pipeline_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pipeline runs</h1>
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3">When</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Status</th>
              <th className="p-3">Model</th>
              <th className="p-3">Tokens</th>
              <th className="p-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {(runs ?? []).map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="p-3 text-muted-foreground">{formatDate(r.created_at)}</td>
                <td className="p-3">
                  <Badge variant="secondary">{r.stage}</Badge>
                </td>
                <td className="p-3">
                  <Badge
                    variant={
                      r.status === "success"
                        ? "success"
                        : r.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="p-3 text-xs">{r.model ?? "—"}</td>
                <td className="p-3 text-xs">
                  {r.tokens_in ?? 0}/{r.tokens_out ?? 0}
                </td>
                <td className="p-3 text-xs max-w-md">
                  <pre className="whitespace-pre-wrap break-words">
                    {r.error ?? JSON.stringify(r.output ?? {}, null, 0)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
