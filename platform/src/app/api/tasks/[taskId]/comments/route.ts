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
  prefix: "rl:tasks-comments",
};

export async function POST(
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

  if (
    !body.content?.trim() &&
    (!body.attachments || body.attachments.length === 0)
  ) {
    return NextResponse.json(
      { error: "Comment must have content or attachments" },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }

  const supabase = createServiceClient();

  // Verify task exists
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404, headers: rateLimitHeaders(rl) },
    );
  }

  const { data: comment, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: taskId,
      user_id: body.user_id,
      content: body.content || "",
      attachments: body.attachments?.length > 0 ? body.attachments : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }

  return NextResponse.json(
    { comment },
    { status: 201, headers: rateLimitHeaders(rl) },
  );
}
