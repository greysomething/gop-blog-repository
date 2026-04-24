"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const initialError =
    params.get("error") === "not_admin"
      ? "You are signed in but this account is not an admin."
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-6">Admin sign-in</h1>
      {initialError && (
        <div className="mb-4 rounded-md bg-amber-50 text-amber-900 p-3 text-sm">{initialError}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Input
          type="email"
          placeholder="you@giftofparenthood.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <Button type="submit" disabled={busy} className="w-full" variant="brand">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-6">
        Need access? Ask an existing admin to promote your account in Supabase (profiles.role =
        &apos;admin&apos;).
      </p>
    </div>
  );
}
