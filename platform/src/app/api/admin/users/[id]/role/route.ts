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
  prefix: "rl:admin-role",
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
  const { data: profile } = await sbSession
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403, headers: rateLimitHeaders(rl) },
    );
  }

  const body = await req.json();
  const { role, client_id } = body;
  const validRoles = ["admin", "engineer", "seller", "client"];
  if (!role || !validRoles.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }
  if (role === "client" && !client_id) {
    return NextResponse.json(
      { error: "client_id is required when role is client" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const supabase = createServiceClient();
  // Per D-12: only include client_id in update when new role IS client
  const updatePayload: Record<string, unknown> = { role };
  if (role === "client" && client_id) {
    updatePayload.client_id = client_id;
  }

  const { data: updated, error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    undefined;

  await logAuditEvent({
    actor_id: user.id,
    action: "user.role_change",
    target_id: params.id,
    metadata: { new_role: role, client_id: client_id || null },
    ip_address: ip,
  });

  return NextResponse.json(
    { user: updated },
    { headers: rateLimitHeaders(rl) },
  );
}
