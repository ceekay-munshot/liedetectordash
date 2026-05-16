import { NextResponse } from "next/server";
import { runMunsAgent } from "@/lib/muns/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  ticker?: string;
  company?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body */
  }

  const ticker = (body.ticker ?? "").trim();
  const company = (body.company ?? "").trim();

  if (!ticker || !company) {
    return NextResponse.json(
      { error: "Ticker and company are required." },
      { status: 400 },
    );
  }

  try {
    const result = await runMunsAgent({ ticker, company });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/muns/run] MUNS failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
