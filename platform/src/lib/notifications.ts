import type { NotificationType } from "@/lib/types";
import { sendEmail } from "@/lib/email";
import { TaskStatusEmail } from "@/lib/emails/TaskStatusEmail";
import { sendTaskCreatedMessage } from "@/lib/slack";
import React from "react";

// Use loose type to avoid SDK version mismatch between @supabase/ssr and @supabase/supabase-js
type SupabaseAdmin = { from: (table: string) => any };

export async function createNotification(
  supabase: SupabaseAdmin,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    actionLink?: string;
  },
): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    action_link: params.actionLink ?? null,
  });
}

export async function notifyTaskEvent(
  taskId: string,
  eventType: "task_created" | "task_updated",
  supabase: SupabaseAdmin,
  actorUserId?: string,
): Promise<void> {
  // Step 1: Fetch task
  let task: any;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();
    if (error || !data) return;
    task = data;
  } catch (err) {
    console.error("[notify] fetch-task failed:", err);
    return;
  }

  // Step 2: Fetch client
  let client: any;
  try {
    const { data, error } = await supabase
      .from("clients")
      .select("id, email, name, slack_channel, market")
      .eq("id", task.client_id)
      .single();
    if (error || !data) return;
    client = data;
  } catch (err) {
    console.error("[notify] fetch-client failed:", err);
    return;
  }

  // Step 3: Determine locale
  const locale = client.market === "LATAM" ? "es" : "en";

  // Step 4: Determine recipient IDs per event type
  let recipientIds: string[];
  let recipientUsers: any[];

  if (eventType === "task_updated") {
    // Deduplicated assigned_to + created_by, skip nulls (per D-11)
    recipientIds = Array.from(
      new Set([task.assigned_to, task.created_by].filter(Boolean) as string[]),
    );

    // Step 5: Fetch user records for recipients
    try {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("id", recipientIds);
      recipientUsers = data ?? [];
    } catch (err) {
      console.error("[notify] fetch-users-updated failed:", err);
      recipientUsers = [];
    }
  } else {
    // task_created: admin/engineer users only (per D-12)
    try {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name")
        .in("role", ["admin", "engineer"]);
      recipientUsers = data ?? [];
      recipientIds = recipientUsers.map((u: any) => u.id);
    } catch (err) {
      console.error("[notify] fetch-users-created failed:", err);
      recipientUsers = [];
      recipientIds = [];
    }
  }

  // Step 6: Determine actor name
  const actorUser = actorUserId
    ? recipientUsers.find((u: any) => u.id === actorUserId)
    : undefined;
  const actorName = actorUser?.full_name ?? "Vantx";

  // Step 7: Build task URL
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/portal/tasks?selected=${taskId}`;

  // Step 8: For each recipient — send email + insert notification row
  for (const user of recipientUsers) {
    const subject =
      eventType === "task_updated"
        ? locale === "es"
          ? "Actualizacion de tarea"
          : "Task update"
        : locale === "es"
          ? "Nueva tarea creada"
          : "New task created";

    // Step 7.5: Check notification preferences (NOTIF-12, D-21, D-22)
    let emailEnabled = true;
    let inAppEnabled = true;
    try {
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("email_enabled, in_app_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      // Opt-out model: null row = all enabled (D-03, D-22)
      emailEnabled = prefs?.email_enabled !== false;
      inAppEnabled = prefs?.in_app_enabled !== false;
    } catch (err) {
      console.error("[notify] prefs-lookup failed:", err);
      // On error, default to sending (fail-open)
    }

    if (emailEnabled) {
      try {
        await sendEmail({
          to: user.email,
          subject,
          react: React.createElement(TaskStatusEmail, {
            locale,
            taskTitle: task.title,
            newStatus: task.status,
            changedByName: actorName,
            taskUrl,
          }),
        });
      } catch (err) {
        console.error("[notify] send-email failed:", err);
      }
    }

    if (inAppEnabled) {
      try {
        await createNotification(supabase, {
          userId: user.id,
          type: eventType,
          title: subject,
          body: `"${task.title}" — ${task.status}`,
          actionLink: taskUrl,
        });
      } catch (err) {
        console.error("[notify] create-notification failed:", err);
      }
    }
  }

  // Step 9: Slack on task_created only, and only if client has slack_channel (per D-17)
  if (eventType === "task_created" && client.slack_channel) {
    try {
      await sendTaskCreatedMessage({
        channelId: "#" + client.slack_channel,
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        type: task.type,
        createdByName: actorName,
        locale,
      });
    } catch (err) {
      console.error("[notify] send-slack failed:", err);
    }
  }
}
