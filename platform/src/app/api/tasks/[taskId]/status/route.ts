import { NextResponse } from "next/server";
import {
  createServiceClient,
  createServerSupabase,
} from "@/lib/supabase/server";
import { notifyTaskEvent } from "@/lib/notifications";
import {
  rateLimit,
  getRateLimitIdentifier,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

const RL_CONFIG = {
  requests: 20,
  window: "1 m" as const,
  prefix: "rl:tasks-status",
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

  // Validate required field
  if (!body.status) {
    return NextResponse.json(
      { error: "Missing required field: status" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  // Validate status value
  const validStatuses = [
    "open",
    "in_progress",
    "waiting_client",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const supabase = createServiceClient();

  const updatePayload: Record<string, any> = { status: body.status };
  if (body.status === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", params.taskId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  // Fire-and-forget notification (per D-01, D-02, D-03)
  notifyTaskEvent(task.id, "task_updated", supabase, body.changed_by).catch(
    (err) => console.error("[notify] task_updated error:", err),
  );

  return NextResponse.json({ task }, { headers: rateLimitHeaders(rl) });
}
