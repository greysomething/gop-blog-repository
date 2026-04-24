import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/admin/login?error=not_admin");

  return { user, profile };
}

export function assertCron(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET not configured");
  if (auth !== `Bearer ${secret}`) {
    throw new Response("Unauthorized", { status: 401 });
  }
}
