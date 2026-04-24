import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { assertCron } from "@/lib/auth";
import { runPublish } from "@/lib/pipeline/publish";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertCron(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  try {
    const result = await runPublish();
    if (result.published > 0) {
      revalidatePath("/");
      revalidatePath("/sitemap.xml");
      revalidatePath("/rss.xml");
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const err = e as Error & { status?: number; error?: unknown };
    console.error("[publish] error", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? String(e), status: err.status, details: err.error },
      { status: 500 },
    );
  }
}

export const POST = GET;
