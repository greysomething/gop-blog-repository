"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SourceForm = {
  id: string | null;
  name: string;
  url: string;
  feed_url: string | null;
  source_type: "rss" | "sitemap" | "scrape";
  trust_tier: 1 | 2 | 3;
  domain_authority: number;
  topic_cluster: string | null;
  is_active: boolean;
  crawl_notes?: string | null;
};

const EMPTY: SourceForm = {
  id: null,
  name: "",
  url: "",
  feed_url: "",
  source_type: "rss",
  trust_tier: 2,
  domain_authority: 50,
  topic_cluster: "",
  is_active: true,
};

export function SourceEditor({ source }: { source?: SourceForm }) {
  const router = useRouter();
  const [s, setS] = useState<SourceForm>(source ?? EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const isNew = !s.id;

  function set<K extends keyof SourceForm>(key: K, value: SourceForm[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const payload = {
      name: s.name.trim(),
      url: s.url.trim(),
      feed_url: s.feed_url?.trim() || null,
      source_type: s.source_type,
      trust_tier: s.trust_tier,
      domain_authority: Number(s.domain_authority) || 50,
      topic_cluster: s.topic_cluster?.trim() || null,
      is_active: s.is_active,
    };

    if (!payload.name || !payload.url) {
      setBusy(false);
      setMsg({ kind: "err", text: "Name and URL are required." });
      return;
    }

    const { data, error } = isNew
      ? await supabase.from("sources").insert(payload).select("id").single()
      : await supabase.from("sources").update(payload).eq("id", s.id!).select("id").single();

    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    setMsg({ kind: "ok", text: isNew ? "Created." : "Saved." });
    if (isNew && data?.id) {
      router.push(`/admin/sources/${data.id}`);
    } else {
      router.refresh();
    }
  }

  async function destroy() {
    if (!s.id) return;
    if (!confirm(`Delete source "${s.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("sources").delete().eq("id", s.id);
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    router.push("/admin/sources");
    router.refresh();
  }

  async function toggleActive() {
    set("is_active", !s.is_active);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Name" hint="Shown in the admin list. Must be unique.">
        <Input value={s.name} onChange={(e) => set("name", e.target.value)} required />
      </Field>

      <Field label="URL" hint="Canonical homepage of the source (used as fallback if no feed_url).">
        <Input value={s.url} onChange={(e) => set("url", e.target.value)} required />
      </Field>

      <Field
        label="Feed URL"
        hint="RSS or sitemap URL. Required for source_type=rss/sitemap. Leave blank for scrape."
      >
        <Input
          value={s.feed_url ?? ""}
          onChange={(e) => set("feed_url", e.target.value)}
          placeholder="https://example.com/feed.xml"
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Source type">
          <select
            value={s.source_type}
            onChange={(e) => set("source_type", e.target.value as SourceForm["source_type"])}
            className="h-10 w-full rounded-md border px-3 text-sm bg-background"
          >
            <option value="rss">rss</option>
            <option value="sitemap">sitemap</option>
            <option value="scrape">scrape</option>
          </select>
        </Field>

        <Field label="Trust tier" hint="1=peer-reviewed/gov, 2=nonprofit, 3=journalism">
          <select
            value={s.trust_tier}
            onChange={(e) => set("trust_tier", Number(e.target.value) as 1 | 2 | 3)}
            className="h-10 w-full rounded-md border px-3 text-sm bg-background"
          >
            <option value={1}>1 — Peer-reviewed / gov</option>
            <option value={2}>2 — Nonprofit / patient ed</option>
            <option value={3}>3 — Journalism / clinic</option>
          </select>
        </Field>

        <Field label="Domain authority" hint="0–100, used as a tiebreaker">
          <Input
            type="number"
            min={0}
            max={100}
            value={s.domain_authority}
            onChange={(e) => set("domain_authority", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Topic cluster" hint="Free-form tag like 'ivf', 'pcos', 'adoption'">
        <Input
          value={s.topic_cluster ?? ""}
          onChange={(e) => set("topic_cluster", e.target.value)}
          placeholder="ivf"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={toggleActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            s.is_active ? "bg-green-500" : "bg-slate-300"
          }`}
          aria-pressed={s.is_active}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              s.is_active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm">
          {s.is_active ? "Active — included in research runs" : "Inactive — skipped"}
        </span>
      </div>

      {!isNew && s.crawl_notes && (
        <Field label="Last crawl notes" hint="Last error logged when fetching this source's feed.">
          <Textarea value={s.crawl_notes} readOnly className="font-mono text-xs bg-slate-50" />
        </Field>
      )}

      {msg && (
        <div
          className={`text-sm rounded-md p-3 ${
            msg.kind === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button onClick={save} disabled={busy} variant="brand">
          {busy ? "Saving…" : isNew ? "Create source" : "Save changes"}
        </Button>
        {!isNew && (
          <Button onClick={destroy} disabled={busy} variant="destructive">
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
