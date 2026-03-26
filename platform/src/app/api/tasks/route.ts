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

const RL_CONFIG = { requests: 20, window: "1 m" as const, prefix: "rl:tasks" };

export async function POST(req: Request) {
  // Rate limit (20/min for task mutation routes)
  const sbSession = createServerSupabase();
  const {
    data: { user },
  } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  const body = await req.json();

  // Validate required fields
  if (!body.client_id || !body.title || !body.priority || !body.type) {
    return NextResponse.json(
      { error: "Missing required fields: client_id, title, priority, type" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const supabase = createServiceClient();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      client_id: body.client_id,
      title: body.title,
      description: body.description || null,
      priority: body.priority,
      type: body.type,
      status: "open",
      created_by: body.created_by || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  // Fire-and-forget notification (per D-01, D-02, D-03)
  notifyTaskEvent(task.id, "task_created", supabase, body.created_by).catch(
    (err) => console.error("[notify] task_created error:", err),
  );

  return NextResponse.json(
    { task },
    { status: 201, headers: rateLimitHeaders(rl) },
  );
}
