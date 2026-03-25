// ═══ src/lib/slack.ts — Slack Web API client ═══

import type { Client, OnboardingStepResult } from "./types";

const SLACK_API = "https://slack.com/api";

function botToken(): string {
  return process.env.SLACK_BOT_TOKEN || "";
}

function isConfigured(): boolean {
  return !!process.env.SLACK_BOT_TOKEN;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${botToken()}`,
    "Content-Type": "application/json",
  };
}

function skip(step: string): OnboardingStepResult {
  return {
    step,
    status: "skipped",
    message: "Slack not configured (SLACK_BOT_TOKEN missing)",
  };
}

function sanitizeChannelName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ─── Channel management ───

async function findChannel(name: string): Promise<string | null> {
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({
      types: "public_channel",
      limit: "200",
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetch(`${SLACK_API}/conversations.list?${params}`, {
      headers: headers(),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as any;
    if (!data.ok) return null;

    const found = data.channels?.find((c: any) => c.name === name);
    if (found) return found.id;

    cursor = data.response_metadata?.next_cursor;
  } while (cursor);

  return null;
}

async function createChannel(
  clientShortName: string,
): Promise<{ channelId: string; channelName: string }> {
  const channelName = `vantx-${sanitizeChannelName(clientShortName)}`;

  // Idempotency: check if channel exists
  const existingId = await findChannel(channelName);
  if (existingId) return { channelId: existingId, channelName };

  // Create channel
  const res = await fetch(`${SLACK_API}/conversations.create`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ name: channelName, is_private: false }),
  });
  const data = (await res.json()) as any;
  if (!data.ok) {
    if (data.error === "name_taken") {
      // Channel exists but might not be in our list (archived, etc.)
      const retryId = await findChannel(channelName);
      if (retryId) return { channelId: retryId, channelName };
    }
    throw new Error(`Slack conversations.create failed: ${data.error}`);
  }

  const channelId = data.channel.id;

  // Set topic and purpose
  await fetch(`${SLACK_API}/conversations.setTopic`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      channel: channelId,
      topic: `Vantx SRE — ${clientShortName}`,
    }),
  });

  await fetch(`${SLACK_API}/conversations.setPurpose`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      channel: channelId,
      purpose: "Monitoring, incidents, and performance updates",
    }),
  });

  return { channelId, channelName };
}

// ─── Welcome message ───

async function sendWelcomeMessage(
  channelId: string,
  params: {
    clientName: string;
    grafanaUrl?: string;
    faroSnippet?: string;
  },
): Promise<void> {
  const blocks: any[] = [
    {
      type: "header",
      text: { type: "plain_text", text: "Welcome to Vantx SRE!", emoji: true },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${params.clientName}* — your monitoring stack is ready.\n\nYour Vantx SRE team will post weekly updates, incident alerts, and performance reports here.`,
      },
    },
    { type: "divider" },
  ];

  if (params.grafanaUrl) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Dashboards*\n<${params.grafanaUrl}|Open Grafana> — RED, USE, k6, Web Vitals, SLO, PostgreSQL`,
      },
    });
  }

  if (params.faroSnippet) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Frontend Observability (Faro SDK)*\nAdd this to your app to start collecting Real User Monitoring data:",
      },
    });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "```\n" + params.faroSnippet + "\n```" },
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: "Powered by Vantx — vantx.io" }],
  });

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      channel: channelId,
      blocks,
      text: `Welcome to Vantx SRE, ${params.clientName}!`,
    }),
  });
  const data = (await res.json()) as any;
  if (!data.ok) throw new Error(`Slack chat.postMessage failed: ${data.error}`);
}

// ─── Priority color map ───

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#C0392B",
  high: "#E67E22",
  medium: "#F1C40F",
  low: "#95A5A6",
};

// ─── Task created message ───

export async function sendTaskCreatedMessage(params: {
  channelId: string;
  taskId: string;
  title: string;
  priority: string;
  type: string;
  createdByName: string;
  locale: string;
}): Promise<void> {
  if (!isConfigured()) return;

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${params.locale}/portal/tasks/${params.taskId}`;

  const payload = {
    channel: params.channelId,
    text: `New task: ${params.title}`,
    attachments: [
      {
        color: PRIORITY_COLORS[params.priority] || "#95A5A6",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${params.title}*` },
            accessory: {
              type: "button",
              text: { type: "plain_text", text: "View in Portal" },
              url: portalUrl,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Priority:* ${params.priority}  |  *Type:* ${params.type}  |  *By:* ${params.createdByName}`,
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch(`${SLACK_API}/chat.postMessage`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as any;
  if (!data.ok) throw new Error(`Slack chat.postMessage failed: ${data.error}`);
}

// ─── Public API ───

export async function provisionSlack(
  client: Pick<Client, "short_name" | "name">,
  grafanaUrl?: string,
  faroSnippet?: string,
): Promise<OnboardingStepResult[]> {
  if (!isConfigured()) {
    return [skip("slack-create-channel"), skip("slack-welcome-message")];
  }

  const results: OnboardingStepResult[] = [];

  // 1. Create channel
  let channelId: string | undefined;
  let channelName: string | undefined;
  try {
    const channel = await createChannel(client.short_name);
    channelId = channel.channelId;
    channelName = channel.channelName;
    results.push({
      step: "slack-create-channel",
      status: "success",
      message: `Channel #${channelName} ready`,
      data: { channelId, channelName },
    });
  } catch (err) {
    results.push({
      step: "slack-create-channel",
      status: "failed",
      message: String(err),
    });
    return results;
  }

  // 2. Welcome message
  try {
    await sendWelcomeMessage(channelId, {
      clientName: client.name,
      grafanaUrl,
      faroSnippet,
    });
    results.push({
      step: "slack-welcome-message",
      status: "success",
      message: "Welcome message sent",
    });
  } catch (err) {
    results.push({
      step: "slack-welcome-message",
      status: "failed",
      message: String(err),
    });
  }

  return results;
}
