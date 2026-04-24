import { NextResponse } from "next/server";
import { assertCron } from "@/lib/auth";
import { runResearch } from "@/lib/pipeline/research";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertCron(req);
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
  try {
    const result = await runResearch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const err = e as Error & { status?: number; error?: unknown };
    console.error("[research] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message ?? String(e),
        status: err.status,
        details: err.error ?? undefined,
        stack: err.stack?.split("\n").slice(0, 6).join("\n"),
      },
      { status: 500 },
    );
  }
}

export const POST = GET;
