"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Post = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_md: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_url: string | null;
  status: string;
};

export function PostEditor({ post }: { post: Post }) {
  const router = useRouter();
  const [p, setP] = useState(post);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof Post>(key: K, value: Post[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }

  async function save(extra?: Partial<Post>) {
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const patch = { ...p, ...extra };
    const { error } = await supabase
      .from("posts")
      .update({
        slug: patch.slug,
        title: patch.title,
        subtitle: patch.subtitle,
        body_md: patch.body_md,
        excerpt: patch.excerpt,
        seo_title: patch.seo_title,
        seo_description: patch.seo_description,
        cover_image_url: patch.cover_image_url,
        status: patch.status,
      })
      .eq("id", p.id);
    setBusy(false);
    if (error) setMsg(error.message);
    else {
      setMsg("Saved.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Title">
        <Input value={p.title} onChange={(e) => set("title", e.target.value)} />
      </Field>
      <Field label="Slug">
        <Input value={p.slug} onChange={(e) => set("slug", e.target.value)} />
      </Field>
      <Field label="Subtitle">
        <Input value={p.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
      </Field>
      <Field label="Cover image URL">
        <Input
          value={p.cover_image_url ?? ""}
          onChange={(e) => set("cover_image_url", e.target.value)}
        />
      </Field>
      <Field label="Excerpt">
        <Textarea value={p.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} />
      </Field>
      <Field label="SEO title">
        <Input value={p.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value)} />
      </Field>
      <Field label="SEO description">
        <Textarea
          value={p.seo_description ?? ""}
          onChange={(e) => set("seo_description", e.target.value)}
        />
      </Field>
      <Field label="Body (Markdown)">
        <Textarea
          value={p.body_md}
          onChange={(e) => set("body_md", e.target.value)}
          className="min-h-[480px] font-mono text-sm"
        />
      </Field>
      <Field label="Status">
        <select
          value={p.status}
          onChange={(e) => set("status", e.target.value)}
          className="h-10 rounded-md border px-3 text-sm bg-background"
        >
          {["draft", "scored", "queued", "published", "archived", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}
      <div className="flex gap-3">
        <Button disabled={busy} onClick={() => save()} variant="default">
          {busy ? "Saving…" : "Save"}
        </Button>
        {p.status !== "published" && (
          <Button
            disabled={busy}
            variant="brand"
            onClick={() => save({ status: "published" })}
          >
            Publish now
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      {children}
    </div>
  );
}
