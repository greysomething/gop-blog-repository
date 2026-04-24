"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function QueueReviewForm({
  queueId,
  initial,
}: {
  queueId: string;
  initial: { title: string; subtitle: string; body_md: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [body, setBody] = useState(initial.body_md);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(action: "approve" | "reject") {
    setBusy(true);
    setErr(null);
    const edits =
      action === "approve" && (title !== initial.title || subtitle !== initial.subtitle || body !== initial.body_md)
        ? { title, subtitle: subtitle || null, body_md: body }
        : undefined;
    const res = await fetch(`/api/admin/queue/${queueId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, edits }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(await res.text());
      return;
    }
    router.push("/admin/queue");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Subtitle</label>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Body (Markdown)</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[480px] font-mono text-sm"
        />
      </div>
      {err && <div className="text-sm text-red-600">{err}</div>}
      <div className="flex gap-3">
        <Button variant="brand" disabled={busy} onClick={() => submit("approve")}>
          {busy ? "Saving…" : "Approve & publish"}
        </Button>
        <Button variant="destructive" disabled={busy} onClick={() => submit("reject")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
