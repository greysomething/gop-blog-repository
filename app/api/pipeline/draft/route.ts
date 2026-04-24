import { NextResponse } from "next/server";
import { assertCron } from "@/lib/auth";
import { runDraft } from "@/lib/pipeline/draft";

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
  const result = await runDraft();
  return NextResponse.json({ ok: true, ...result });
}

export const POST = GET;
