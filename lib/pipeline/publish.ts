import { createAdminClient } from "@/lib/supabase/admin";
import { AUTO_PUBLISH_THRESHOLD } from "@/lib/pipeline/score";

export async function runPublish() {
  const supabase = createAdminClient();
  const started = Date.now();

  // Auto-publish only posts that:
  //   - are in status 'scored' (scorer did NOT force review)
  //   - have confidence_score >= threshold
  const { data: eligible } = await supabase
    .from("posts")
    .select("id, confidence_score")
    .eq("status", "scored")
    .gte("confidence_score", AUTO_PUBLISH_THRESHOLD)
    .limit(10);

  if (!eligible?.length) return { published: 0 };

  const ids = eligible.map((p) => p.id);
  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      auto_published: true,
      published_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (error) {
    await supabase.from("pipeline_runs").insert({
      stage: "publish",
      status: "error",
      error: error.message,
      duration_ms: Date.now() - started,
    });
    throw error;
  }

  await supabase.from("pipeline_runs").insert({
    stage: "publish",
    status: "success",
    duration_ms: Date.now() - started,
    output: { published: ids.length, post_ids: ids },
  });

  return { published: ids.length };
}
