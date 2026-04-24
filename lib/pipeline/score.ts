import { createAdminClient } from "@/lib/supabase/admin";
import { callJSON, MODEL_SCORE } from "@/lib/ai/anthropic";
import { getActivePrompt } from "@/lib/ai/prompts";

interface ScoreResult {
  rubric: {
    source_quality: number;
    citation_coverage: number;
    risk: number;
    fact_check: number;
    editorial: number;
  };
  confidence_score: number;
  unverified_claims: string[];
  forces_review: boolean;
  notes: string;
}

const BATCH = 5;
export const AUTO_PUBLISH_THRESHOLD = 95;

export async function runScore() {
  const supabase = createAdminClient();
  const started = Date.now();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body_md, topic_id")
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (!posts?.length) return { scored: 0 };

  const prompt = await getActivePrompt("scorer_v1");
  let scored = 0;

  for (const post of posts) {
    try {
      const { data: citations } = await supabase
        .from("citations")
        .select("position, claim, url, source_title, source_tier")
        .eq("post_id", post.id)
        .order("position");

      const topic = post.topic_id
        ? (await supabase.from("topics").select("medical_legal_flag").eq("id", post.topic_id).maybeSingle()).data
        : null;

      const { json, tokens_in, tokens_out } = await callJSON<ScoreResult>({
        model: MODEL_SCORE,
        system: prompt.body,
        user: JSON.stringify({
          post: { title: post.title, body_md: post.body_md },
          citations: citations ?? [],
          medical_legal_flag: topic?.medical_legal_flag ?? false,
        }),
        maxTokens: 4000,
      });

      // Hard-gate logic, enforced server-side regardless of model's forces_review value.
      const hasUnverified = (json.unverified_claims ?? []).length > 0;
      const medicalLegal = !!topic?.medical_legal_flag;
      const forcesReview = json.forces_review || hasUnverified || medicalLegal;

      // Recompute confidence from rubric to defend against model arithmetic drift.
      const r = json.rubric;
      const confidence =
        0.25 * r.source_quality +
        0.20 * r.citation_coverage +
        0.20 * (100 - r.risk) +
        0.20 * r.fact_check +
        0.15 * r.editorial;

      const nextStatus = forcesReview ? "queued" : "scored";

      await supabase
        .from("posts")
        .update({
          status: nextStatus,
          confidence_score: Math.round(confidence * 100) / 100,
          rubric: r,
        })
        .eq("id", post.id);

      if (forcesReview) {
        await supabase.from("review_queue").upsert(
          {
            post_id: post.id,
            reason: medicalLegal
              ? "Medical/legal topic — human review required."
              : hasUnverified
                ? `Unverified claims: ${json.unverified_claims.slice(0, 3).join(" | ")}`
                : "Model flagged for review.",
            notes: json.notes,
          },
          { onConflict: "post_id" },
        );
      }

      await supabase.from("pipeline_runs").insert({
        stage: "score",
        status: "success",
        model: MODEL_SCORE,
        prompt_version: prompt.version,
        tokens_in,
        tokens_out,
        duration_ms: Date.now() - started,
        post_id: post.id,
        output: { confidence, forces_review: forcesReview, rubric: r },
      });

      scored++;
    } catch (e) {
      await supabase.from("pipeline_runs").insert({
        stage: "score",
        status: "error",
        error: String(e).slice(0, 2000),
        post_id: post.id,
        duration_ms: Date.now() - started,
      });
    }
  }

  return { scored };
}
