import { NextResponse } from "next/server";
import { searchBirdnest } from "@/lib/muns/birdnest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  query?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty body */
  }
  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { results } = await searchBirdnest(query);
    return NextResponse.json({ results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/search] Birdnest failed:", message);
    return NextResponse.json(
      { results: [], error: message },
      { status: 502 },
    );
  }
}
