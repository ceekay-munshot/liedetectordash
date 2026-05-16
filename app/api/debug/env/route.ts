import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary debug route: redacts secret values but reports which keys are
// visible via each lookup path. Remove once we know where the lookup fails.
export async function GET(): Promise<NextResponse> {
  const report: Record<string, unknown> = {};

  const tokenKey = "MUNS_ACCESS_TOKEN";

  const procEnvKeys = Object.keys(process.env).sort();
  report.process_env = {
    has_token: typeof process.env[tokenKey] === "string",
    token_length: process.env[tokenKey]?.length ?? 0,
    all_keys: procEnvKeys,
  };

  try {
    const ctx = getCloudflareContext();
    const env = ctx.env as Record<string, unknown>;
    const ctxKeys = Object.keys(env).sort();
    report.cf_ctx_sync = {
      ok: true,
      has_token: typeof env[tokenKey] === "string",
      token_length:
        typeof env[tokenKey] === "string"
          ? (env[tokenKey] as string).length
          : 0,
      all_keys: ctxKeys,
    };
  } catch (e) {
    report.cf_ctx_sync = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  try {
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;
    const ctxKeys = Object.keys(env).sort();
    report.cf_ctx_async = {
      ok: true,
      has_token: typeof env[tokenKey] === "string",
      token_length:
        typeof env[tokenKey] === "string"
          ? (env[tokenKey] as string).length
          : 0,
      all_keys: ctxKeys,
    };
  } catch (e) {
    report.cf_ctx_async = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return NextResponse.json(report);
}
