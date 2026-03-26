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

const RL_CONFIG = { requests: 5, window: "1 m" as const, prefix: "rl:admin-invite" };

export async function POST(req: Request) {
  // Rate limit (5/min — auth-adjacent per D-04)
  const sbSession = createServerSupabase();
  const {
    data: { user },
  } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  // Auth check — admin-only
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

  // Parse + validate body
  const body = await req.json();
  const { email, role, client_id } = body;
  if (!email || !role) {
    return NextResponse.json(
      { error: "Missing required fields: email, role" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }
  const validRoles = ["admin", "engineer", "seller", "client"];
  if (!validRoles.includes(role)) {
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

  // Check email uniqueness (D-05) — query public.users
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409, headers: rateLimitHeaders(rl) },
    );
  }

  // Send invite with metadata (per D-02, D-03)
  const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role, client_id: client_id || null },
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  return NextResponse.json(
    { success: true, email },
    { status: 201, headers: rateLimitHeaders(rl) },
  );
}
