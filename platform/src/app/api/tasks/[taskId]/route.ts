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

const RL_CONFIG = {
  requests: 20,
  window: "1 m" as const,
  prefix: "rl:tasks-update",
};

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } },
) {
  // Rate limit (20/min for task mutation routes)
  const sbSession = createServerSupabase();
  const {
    data: { user },
  } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();
  const { taskId } = params;

  const supabase = createServiceClient();

  // Only allow updating title and status
  const updates: Record<string, string> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.status !== undefined) updates.status = body.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  return NextResponse.json({ task }, { headers: rateLimitHeaders(rl) });
}
