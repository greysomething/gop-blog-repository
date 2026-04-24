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

  const json = parseLooseJSON<T>(text);
  return {
    json,
    tokens_in: res.usage.input_tokens,
    tokens_out: res.usage.output_tokens,
  };
}

// Extract the outermost balanced JSON object from text, tolerating code fences
// and unescaped control characters (newlines/tabs inside string values, which
// Claude occasionally emits in long outputs).
export function parseLooseJSON<T>(text: string): T {
  const candidates: string[] = [];

  // 1. Prefer fenced blocks.
  for (const m of text.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)) {
    candidates.push(m[1].trim());
  }
  // 2. Fall back to whole text.
  candidates.push(text.trim());

  for (const c of candidates) {
    const obj = extractBalancedObject(c);
    if (!obj) continue;
    try {
      return JSON.parse(obj) as T;
    } catch {
      // Tolerate unescaped control chars in string values.
      try {
        return JSON.parse(sanitizeControlChars(obj)) as T;
      } catch {
        /* try next candidate */
      }
    }
  }

  throw new Error(`Could not parse JSON from model output: ${text.slice(0, 400)}`);
}

function extractBalancedObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function sanitizeControlChars(json: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (const ch of json) {
    if (escape) {
      out += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      out += ch;
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}
