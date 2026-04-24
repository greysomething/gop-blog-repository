import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabaseAuth
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { action, edits } = (await req.json()) as {
    action: "approve" | "reject";
    edits?: { title?: string; body_md?: string; subtitle?: string };
  };
  const supabase = supabaseAuth;

  // Load the queue row to get the post id.
  const { data: q } = await supabase
    .from("review_queue")
    .select("id, post_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (edits) {
    await supabase.from("posts").update(edits).eq("id", q.post_id);
  }

  if (action === "approve") {
    await supabase
      .from("posts")
      .update({
        status: "published",
        auto_published: false,
        published_at: new Date().toISOString(),
        author_id: user.id,
      })
      .eq("id", q.post_id);
    // Mark all citations verified by this admin.
    await supabase
      .from("citations")
      .update({ verified: true, verified_by: user.id, verified_at: new Date().toISOString() })
      .eq("post_id", q.post_id);
    await supabase
      .from("review_queue")
      .update({ decision: "approved", reviewed_at: new Date().toISOString(), assigned_to: user.id })
      .eq("id", q.id);
    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
  } else if (action === "reject") {
    await supabase.from("posts").update({ status: "rejected" }).eq("id", q.post_id);
    await supabase
      .from("review_queue")
      .update({ decision: "rejected", reviewed_at: new Date().toISOString(), assigned_to: user.id })
      .eq("id", q.id);
  }

  return NextResponse.json({ ok: true });
}
