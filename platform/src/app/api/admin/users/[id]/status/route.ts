import { NextResponse } from "next/server";
import {
  createServiceClient,
  createServerSupabase,
} from "@/lib/supabase/server";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

const RL_CONFIG = {
  requests: 20,
  window: "1 m" as const,
  prefix: "rl:admin-status",
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const sbSession = createServerSupabase();
  const {
    data: { user },
  } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: rateLimitHeaders(rl) },
    );
  }
  const { data: callerProfile } = await sbSession
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: rateLimitHeaders(rl) },
    );
  }

  const supabase = createServiceClient();

  // Get current is_active state
  const { data: target, error: fetchError } = await supabase
    .from("users")
    .select("is_active")
    .eq("id", params.id)
    .single();

  if (fetchError || !target) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: rateLimitHeaders(rl) },
    );
  }

  const newIsActive = !target.is_active;

  // Toggle is_active in public.users
  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ is_active: newIsActive })
    .eq("id", params.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  // Sync ban state in Supabase Auth (per D-15)
  // 876000h = ~100 years (effective permanent ban), 'none' removes ban
  await supabase.auth.admin.updateUserById(params.id, {
    ban_duration: newIsActive ? "none" : "876000h",
  });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  await logAuditEvent({
    actor_id: user.id,
    action: newIsActive ? "user.reactivate" : "user.deactivate",
    target_id: params.id,
    metadata: { new_is_active: newIsActive },
    ip_address: ip,
  });

  return NextResponse.json(
    { user: updated },
    { headers: rateLimitHeaders(rl) },
  );
}
