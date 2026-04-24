import { createAdminClient } from "@/lib/supabase/admin";
import { callJSON, MODEL_DRAFT } from "@/lib/ai/anthropic";
import { getActivePrompt } from "@/lib/ai/prompts";

interface DraftedPost {
  title: string;
  subtitle?: string;
  slug: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  body_md: string;
  category_slug: string;
  tags: string[];
  citations: Array<{
    position: number;
    claim: string;
    url: string;
    source_title: string;
    source_tier: 1 | 2 | 3;
  }>;
}

const BATCH = 3; // topics per run

export async function runDraft() {
  const supabase = createAdminClient();
  const started = Date.now();

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .eq("status", "proposed")
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (!topics?.length) return { drafted: 0 };

  const prompt = await getActivePrompt("drafter_v1");
  let drafted = 0;

  for (const topic of topics) {
    try {
      const { json, tokens_in, tokens_out } = await callJSON<DraftedPost>({
        model: MODEL_DRAFT,
        system: prompt.body,
        user: JSON.stringify({
          topic: {
            title: topic.title,
            summary: topic.summary,
            suggested_angle: topic.suggested_angle,
            source_refs: topic.source_refs,
            medical_legal_flag: topic.medical_legal_flag,
          },
        }),
        maxTokens: 8000,
      });

      // Resolve category slug → id.
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", json.category_slug)
        .maybeSingle();

      // Ensure unique slug.
      let slug = json.slug;
      for (let i = 2; i < 10; i++) {
        const { data: existing } = await supabase
          .from("posts")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existing) break;
        slug = `${json.slug}-${i}`;
      }

      const { data: post, error: postErr } = await supabase
        .from("posts")
        .insert({
          slug,
          title: json.title,
          subtitle: json.subtitle ?? null,
          body_md: json.body_md,
          excerpt: json.excerpt,
          seo_title: json.seo_title,
          seo_description: json.seo_description,
          category_id: cat?.id ?? null,
          topic_id: topic.id,
          status: "draft",
        })
        .select("id")
        .single();

      if (postErr || !post) throw postErr ?? new Error("post insert failed");

      // Tags — upsert by slug.
      for (const tagSlug of json.tags ?? []) {
        const { data: tag } = await supabase
          .from("tags")
          .upsert({ slug: tagSlug, name: tagSlug }, { onConflict: "slug" })
          .select("id")
          .single();
        if (tag) {
          await supabase.from("post_tags").insert({ post_id: post.id, tag_id: tag.id });
        }
      }

      // Citations.
      if (json.citations?.length) {
        await supabase.from("citations").insert(
          json.citations.map((c) => ({
            post_id: post.id,
            position: c.position,
            claim: c.claim,
            url: c.url,
            source_title: c.source_title,
            source_tier: c.source_tier,
            verified: false,
          })),
        );
      }

      await supabase.from("topics").update({ status: "drafted" }).eq("id", topic.id);

      await supabase.from("pipeline_runs").insert({
        stage: "draft",
        status: "success",
        model: MODEL_DRAFT,
        prompt_version: prompt.version,
        tokens_in,
        tokens_out,
        duration_ms: Date.now() - started,
        topic_id: topic.id,
        post_id: post.id,
      });

      drafted++;
    } catch (e) {
      await supabase.from("pipeline_runs").insert({
        stage: "draft",
        status: "error",
        error: String(e).slice(0, 2000),
        topic_id: topic.id,
        duration_ms: Date.now() - started,
      });
    }
  }

  return { drafted };
}
