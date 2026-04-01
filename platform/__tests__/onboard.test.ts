import { describe, it, expect, beforeEach, vi } from "vitest";
import type { OnboardingStepResult } from "@/lib/types";

// Mock external service dependencies
vi.mock("@/lib/grafana-cloud", () => ({
  provisionGrafana: vi.fn(),
}));

vi.mock("@/lib/slack", () => ({
  provisionSlack: vi.fn(),
}));

vi.mock("@/lib/k6-config", () => ({
  generateK6Config: vi.fn(),
}));

import { onboardClient } from "@/lib/onboard";
import { provisionGrafana } from "@/lib/grafana-cloud";
import { provisionSlack } from "@/lib/slack";
import { generateK6Config } from "@/lib/k6-config";

const mockProvisionGrafana = vi.mocked(provisionGrafana);
const mockProvisionSlack = vi.mocked(provisionSlack);
const mockGenerateK6Config = vi.mocked(generateK6Config);

const mockClient = {
  id: "client-uuid-1234",
  name: "Acme Corp",
  short_name: "acme",
  email: "acme@example.com",
  market: "US" as const,
  stack: "Next.js",
  infra: "AWS",
  services: ["observability"],
  logo_url: null,
  grafana_org_id: null,
  slack_channel: null,
  trello_board_id: null,
  is_pilot: false,
  status: "prospect" as const,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function buildMockSupabase(
  clientData: any = mockClient,
  updateError: any = null,
) {
  const mockUpdate = {
    eq: vi.fn().mockResolvedValue({ error: updateError }),
  };
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "clients") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: clientData, error: null }),
        update: vi.fn().mockReturnValue(mockUpdate),
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue(mockUpdate),
    };
  });
  return { from: mockFrom };
}

describe("onboardClient — full success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns overall success when all services succeed", async () => {
    const grafanaSuccessSteps: OnboardingStepResult[] = [
      {
        step: "grafana-create-stack",
        status: "success",
        message: "Stack vantx-acme created",
        data: {
          grafanaUrl: "https://acme.grafana.net",
          orgId: 123,
          stackId: 456,
        },
      },
      {
        step: "grafana-faro",
        status: "success",
        message: "Faro activated",
        data: { sdkSnippet: "import faro..." },
      },
    ];
    const slackSuccessSteps: OnboardingStepResult[] = [
      {
        step: "slack-create-channel",
        status: "success",
        message: "Channel ready",
        data: { channelName: "vantx-acme" },
      },
      {
        step: "slack-welcome-message",
        status: "success",
        message: "Welcome sent",
      },
    ];
    const k6SuccessStep: OnboardingStepResult = {
      step: "k6-config",
      status: "success",
      message: "k6 config created",
      data: { slug: "acme" },
    };

    mockProvisionGrafana.mockResolvedValue(grafanaSuccessSteps);
    mockProvisionSlack.mockResolvedValue(slackSuccessSteps);
    mockGenerateK6Config.mockReturnValue(k6SuccessStep);

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    expect(result.overall).toBe("success");
    expect(result.clientId).toBe("client-uuid-1234");
    expect(result.startedAt).toBeDefined();
    expect(result.completedAt).toBeDefined();
  });

  it("calls provisionGrafana with the client", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "slack-welcome-message",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    await onboardClient("client-uuid-1234", supabase);

    expect(mockProvisionGrafana).toHaveBeenCalledWith(
      expect.objectContaining({ id: "client-uuid-1234", short_name: "acme" }),
    );
  });

  it("calls provisionSlack with the client", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "slack-welcome-message",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    await onboardClient("client-uuid-1234", supabase);

    expect(mockProvisionSlack).toHaveBeenCalledWith(
      expect.objectContaining({ short_name: "acme", name: "Acme Corp" }),
      undefined,
      undefined,
    );
  });

  it("updates supabase with grafanaOrgId and slackChannel when available", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "success",
        message: "created",
        data: {
          grafanaUrl: "https://acme.grafana.net",
          orgId: 789,
          stackId: 1,
        },
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "success",
        message: "Channel ready",
        data: { channelName: "vantx-acme" },
      },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });
    const mockFromFn = vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      update: mockUpdateFn,
    }));
    const supabase = { from: mockFromFn };

    await onboardClient("client-uuid-1234", supabase);

    // update should be called with grafana_org_id and/or slack_channel
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        grafana_org_id: "789",
        slack_channel: "vantx-acme",
      }),
    );
  });

  it("returns overall success when all steps are skipped (no keys configured)", async () => {
    const skippedGrafana: OnboardingStepResult[] = [
      {
        step: "grafana-create-stack",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "grafana-datasources",
        status: "skipped",
        message: "not configured",
      },
      { step: "grafana-faro", status: "skipped", message: "not configured" },
      { step: "grafana-irm", status: "skipped", message: "not configured" },
      {
        step: "grafana-dashboards",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "grafana-alert-rules",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "grafana-api-keys",
        status: "skipped",
        message: "not configured",
      },
    ];
    const skippedSlack: OnboardingStepResult[] = [
      {
        step: "slack-create-channel",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "slack-welcome-message",
        status: "skipped",
        message: "not configured",
      },
    ];
    mockProvisionGrafana.mockResolvedValue(skippedGrafana);
    mockProvisionSlack.mockResolvedValue(skippedSlack);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    // When all are skipped except k6 which succeeded, overall should be success
    expect(result.overall).toBe("success");
  });
});

describe("onboardClient — client not found", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failed result when client is not found in database", async () => {
    const mockFromFn = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: "Not found" } }),
    });
    const supabase = { from: mockFromFn };

    const result = await onboardClient("nonexistent-id", supabase);

    expect(result.overall).toBe("failed");
    expect(result.steps[0].step).toBe("fetch-client");
    expect(result.steps[0].status).toBe("failed");
  });
});

describe("onboardClient — partial failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns partial when Slack fails but Grafana succeeds", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "success",
        message: "created",
        data: { grafanaUrl: "https://acme.grafana.net", orgId: 1, stackId: 2 },
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      { step: "slack-create-channel", status: "failed", message: "not_authed" },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    expect(result.overall).toBe("partial");
  });

  it("returns partial when Grafana succeeds but k6 fails", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "success",
        message: "created",
        data: { grafanaUrl: "https://acme.grafana.net", orgId: 1, stackId: 2 },
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "slack-welcome-message",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "failed",
      message: "permission denied",
    });

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    // grafana-create-stack succeeded, k6-config failed, slacks skipped → partial
    expect(result.overall).toBe("partial");
  });

  it("includes grafanaUrl in result when grafana stack succeeds", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "success",
        message: "created",
        data: {
          grafanaUrl: "https://mystack.grafana.net",
          orgId: 1,
          stackId: 2,
        },
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "skipped",
        message: "not configured",
      },
      {
        step: "slack-welcome-message",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    expect(result.grafanaUrl).toBe("https://mystack.grafana.net");
  });

  it("includes slackChannel in result when slack channel succeeds", async () => {
    mockProvisionGrafana.mockResolvedValue([
      {
        step: "grafana-create-stack",
        status: "skipped",
        message: "not configured",
      },
    ]);
    mockProvisionSlack.mockResolvedValue([
      {
        step: "slack-create-channel",
        status: "success",
        message: "Channel ready",
        data: { channelName: "vantx-acme" },
      },
      { step: "slack-welcome-message", status: "success", message: "sent" },
    ]);
    mockGenerateK6Config.mockReturnValue({
      step: "k6-config",
      status: "success",
      message: "done",
    });

    const supabase = buildMockSupabase();
    const result = await onboardClient("client-uuid-1234", supabase);

    expect(result.slackChannel).toBe("vantx-acme");
  });
});
