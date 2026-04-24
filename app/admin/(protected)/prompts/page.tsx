import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const supabase = createClient();
  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .order("stage")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Prompts</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Versioned system prompts. Create new versions in Supabase and flip <code>is_active</code> to
        roll out; the pipeline picks the most recent active prompt per <code>name</code>.
      </p>
      <div className="space-y-4">
        {(prompts ?? []).map((p) => (
          <div key={p.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary">{p.stage}</Badge>
              <span className="font-mono text-sm">{p.name}</span>
              <span className="text-xs text-muted-foreground">{p.version}</span>
              {p.is_active && <Badge variant="success">active</Badge>}
            </div>
            <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-3 rounded border max-h-64 overflow-auto">
              {p.body}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
