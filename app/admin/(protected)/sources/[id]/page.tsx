import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SourceEditor, type SourceForm } from "@/components/admin/SourceEditor";

export const dynamic = "force-dynamic";

export default async function SourceEditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";

  let source: SourceForm | undefined;
  if (!isNew) {
    const supabase = createClient();
    const { data } = await supabase
      .from("sources")
      .select(
        "id, name, url, feed_url, source_type, trust_tier, domain_authority, topic_cluster, is_active, crawl_notes",
      )
      .eq("id", params.id)
      .maybeSingle();
    if (!data) notFound();
    source = data as SourceForm;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/sources" className="text-sm text-muted-foreground hover:underline">
          ← All sources
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">{isNew ? "New source" : source!.name}</h1>
      <SourceEditor source={source} />
    </div>
  );
}
