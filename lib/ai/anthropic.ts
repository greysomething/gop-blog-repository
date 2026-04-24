import Anthropic from "@anthropic-ai/sdk";

export const MODEL_DRAFT = "claude-opus-4-7";
export const MODEL_SCORE = "claude-sonnet-4-6";
export const MODEL_RESEARCH = "claude-sonnet-4-6";

export function anthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey: key });
}

export async function callJSON<T = unknown>(opts: {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ json: T; tokens_in: number; tokens_out: number }> {
  const client = anthropic();
  const res = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Tolerate code fences or leading prose.
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? [null, text];
  const raw = (match[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error(`No JSON object in model output: ${text.slice(0, 200)}`);

  const json = JSON.parse(raw.slice(start, end + 1)) as T;
  return {
    json,
    tokens_in: res.usage.input_tokens,
    tokens_out: res.usage.output_tokens,
  };
}
