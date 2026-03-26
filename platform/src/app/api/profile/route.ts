import { createServerSupabase } from "@/lib/supabase/server";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { Duration } from "@upstash/ratelimit";

const RL_CONFIG = {
  requests: 20,
  window: "1 m" as Duration,
  prefix: "api:profile",
};

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    full_name: data?.full_name ?? "",
    email: data?.email ?? "",
  });
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(getRateLimitIdentifier(req, user.id), RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() : null;
  if (!full_name || full_name.length === 0)
    return NextResponse.json({ error: "full_name required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("users")
    .update({ full_name })
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { headers: rateLimitHeaders(rl) });
}
