import { createAdminClient } from "@/lib/supabase/admin";

export async function getActivePrompt(name: string): Promise<{ body: string; version: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prompts")
    .select("body, version")
    .eq("name", name)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`No active prompt named ${name}`);
  return data;
}
