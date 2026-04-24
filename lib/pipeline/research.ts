import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { callJSON, MODEL_RESEARCH } from "@/lib/ai/anthropic";
import { getActivePrompt } from "@/lib/ai/prompts";
import { fetchFeed, type FeedItem } from "@/lib/pipeline/feeds";

interface ResearchedTopic {
  title: string;
  summary: string;
  suggested_angle: string;
  source_refs: Array<{ url: string; title: string }>;
  medical_legal_flag: boolean;
}

const MAX_ITEMS_PER_SOURCE = 10;
const MAX_TOTAL_ITEMS = 80;

function canonHash(title: string, url: string) {
  const n = `${title.toLowerCase().trim()}|${url.toLowerCase().trim()}`;
  return crypto.createHash("sha256").update(n).digest("hex").slice(0, 32);
}

export async function runResearch() {
  const supabase = createAdminClient();
  const started = Date.now();

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("is_active", true)
    .in("source_type", ["rss", "sitemap"])
    .order("trust_tier", { ascending: true });

  if (!sources?.length) return { harvested: 0, topics: 0 };

  // Harvest — bounded.
  const harvested: Array<FeedItem & { source_id: string; trust_tier: number }> = [];
  for (const src of sources) {
    const url = src.feed_url ?? src.url;
    try {
      const items = await fetchFeed(url, src.source_type);
      for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
        harvested.push({ ...item, source_id: src.id, trust_tier: src.trust_tier });
        if (harvested.length >= MAX_TOTAL_ITEMS) break;
      }
      await supabase
        .from("sources")
        .update({ last_crawled_at: new Date().toISOString(), crawl_notes: null })
        .eq("id", src.id);
    } catch (e) {
      await supabase
        .from("sources")
        .update({ crawl_notes: String(e).slice(0, 500) })
        .eq("id", src.id);
    }
    if (harvested.length >= MAX_TOTAL_ITEMS) break;
  }

  if (!harvested.length) {
    await supabase.from("pipeline_runs").insert({
      stage: "research",
      status: "success",
      duration_ms: Date.now() - started,
      output: { harvested: 0, topics: 0 },
    });
    return { harvested: 0, topics: 0 };
  }

  const prompt = await getActivePrompt("researcher_v1");

  // Give the model tier-annotated items so it prefers Tier 1/2 when proposing topics.
  const userPayload = {
    items: harvested.map((h) => ({
      title: h.title,
      url: h.url,
      excerpt: h.excerpt ?? "",
      trust_tier: h.trust_tier,
    })),
  };

  const { json, tokens_in, tokens_out } = await callJSON<{ topics: ResearchedTopic[] }>({
    model: MODEL_RESEARCH,
    system: prompt.body,
    user: JSON.stringify(userPayload),
    maxTokens: 16000,
  });

  let inserted = 0;
  for (const t of json.topics ?? []) {
    const primaryUrl = t.source_refs?.[0]?.url ?? "";
    const hash = canonHash(t.title, primaryUrl);
    const { error } = await supabase.from("topics").insert({
      title: t.title,
      summary: t.summary,
      suggested_angle: t.suggested_angle,
      source_refs: t.source_refs,
      medical_legal_flag: !!t.medical_legal_flag,
      dedupe_hash: hash,
      status: "proposed",
    });
    if (!error) inserted++;
  }

  await supabase.from("pipeline_runs").insert({
    stage: "research",
    status: "success",
    model: MODEL_RESEARCH,
    prompt_version: prompt.version,
    tokens_in,
    tokens_out,
    duration_ms: Date.now() - started,
    input: { harvested_count: harvested.length },
    output: { topics: inserted },
  });

  return { harvested: harvested.length, topics: inserted };
}
