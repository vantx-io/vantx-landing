// ═══ src/lib/onboard.ts — Client onboarding orchestrator ═══

import type { Client, OnboardingResult, OnboardingStepResult } from "./types";
import { provisionGrafana } from "./grafana-cloud";
import { provisionSlack } from "./slack";
import { generateK6Config } from "./k6-config";

// Use loose type to avoid SDK version mismatch between @supabase/ssr and @supabase/supabase-js
type SupabaseAdmin = { from: (table: string) => any };

export async function onboardClient(
  clientId: string,
  supabase: SupabaseAdmin,
): Promise<OnboardingResult> {
  const startedAt = new Date().toISOString();
  const steps: OnboardingStepResult[] = [];

  // 1. Fetch client
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return {
      clientId,
      overall: "failed",
      steps: [
        {
          step: "fetch-client",
          status: "failed",
          message: `Client not found: ${error?.message || clientId}`,
        },
      ],
      startedAt,
      completedAt: new Date().toISOString(),
    };
  }

  console.log(
    `[onboard] Starting onboarding for ${client.name} (${client.short_name})`,
  );

  // 2. Grafana Cloud provisioning
  let grafanaUrl: string | undefined;
  let faroSnippet: string | undefined;
  let grafanaOrgId: string | undefined;

  try {
    const grafanaResults = await provisionGrafana(client);
    steps.push(...grafanaResults);

    const stackStep = grafanaResults.find(
      (r) => r.step === "grafana-create-stack" && r.status === "success",
    );
    if (stackStep?.data) {
      grafanaUrl = stackStep.data.grafanaUrl;
      grafanaOrgId = String(stackStep.data.orgId);
    }

    const faroStep = grafanaResults.find(
      (r) => r.step === "grafana-faro" && r.status === "success",
    );
    if (faroStep?.data) {
      faroSnippet = faroStep.data.sdkSnippet;
    }
  } catch (err) {
    steps.push({
      step: "grafana-provision",
      status: "failed",
      message: String(err),
    });
  }

  // 3. Slack provisioning
  let slackChannel: string | undefined;

  try {
    const slackResults = await provisionSlack(client, grafanaUrl, faroSnippet);
    steps.push(...slackResults);

    const channelStep = slackResults.find(
      (r) => r.step === "slack-create-channel" && r.status === "success",
    );
    if (channelStep?.data) {
      slackChannel = channelStep.data.channelName;
    }
  } catch (err) {
    steps.push({
      step: "slack-provision",
      status: "failed",
      message: String(err),
    });
  }

  // 4. Generate k6 client config
  try {
    const k6Result = generateK6Config(client);
    steps.push(k6Result);
  } catch (err) {
    steps.push({ step: "k6-config", status: "failed", message: String(err) });
  }

  // 5. Update client record in Supabase
  const updatePayload: Record<string, any> = {};
  if (grafanaOrgId) updatePayload.grafana_org_id = grafanaOrgId;
  if (slackChannel) updatePayload.slack_channel = slackChannel;

  const anyFailed = steps.some((s) => s.status === "failed");
  const anySuccess = steps.some((s) => s.status === "success");
  const allSkipped = steps.every((s) => s.status === "skipped");

  // Set active if at least something succeeded or all steps were skipped (no keys configured)
  if (anySuccess || allSkipped) {
    updatePayload.status = "active";
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateErr } = await supabase
      .from("clients")
      .update(updatePayload)
      .eq("id", clientId);

    steps.push({
      step: "supabase-update-client",
      status: updateErr ? "failed" : "success",
      message: updateErr
        ? `Update failed: ${updateErr.message}`
        : `Updated: ${Object.keys(updatePayload).join(", ")}`,
    });
  }

  // 6. Compute overall
  const hasFailed = steps.some((s) => s.status === "failed");
  const hasSuccess = steps.some((s) => s.status === "success");
  const overall =
    hasFailed && hasSuccess ? "partial" : hasFailed ? "failed" : "success";

  console.log(
    `[onboard] Completed for ${client.short_name}: ${overall} (${steps.length} steps)`,
  );

  return {
    clientId,
    overall,
    steps,
    grafanaUrl,
    slackChannel,
    faroSnippet,
    startedAt,
    completedAt: new Date().toISOString(),
  };
}
