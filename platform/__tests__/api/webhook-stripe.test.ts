import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── vi.mock declarations MUST appear before any route import (Pitfall 6) ──

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(),
  formatCurrency: vi.fn().mockReturnValue("$5,995.00"),
}));

vi.mock("@/lib/onboard", () => ({
  onboardClient: vi.fn().mockResolvedValue({ overall: "ok", steps: [] }),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock email templates to prevent React rendering issues in test environment
vi.mock("@/lib/emails/PaymentSuccessEmail", () => ({
  PaymentSuccessEmail: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/emails/PaymentFailedEmail", () => ({
  PaymentFailedEmail: vi.fn().mockReturnValue(null),
}));

// ─── Imports (AFTER mocks) ──────────────────────────────────────────────────

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/webhooks/stripe/route";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// ─── Shared mock builder ────────────────────────────────────────────────────

/**
 * Build a mock Supabase client with spied methods that handles all chain
 * patterns used by the Stripe webhook route.
 *
 * Exposes mockUpsert, mockInsert, mockUpdate as named spy references
 * for mutation assertions in tests.
 */
function buildWebhookMockSupabase() {
  const mockUpsert = vi.fn().mockResolvedValue({ error: null });
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  // Subscription select chain:
  //   .from('subscriptions').select('client_id').eq('stripe_customer_id', id).single()
  const mockSubscriptionSelect = {
    eq: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({ data: { client_id: "client-001" }, error: null }),
  };

  // Clients select chain:
  //   .from('clients').select('email, name, market').eq('id', id).single()
  const mockClientsSelect = {
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { email: "acme@test.com", name: "Acme", market: "LATAM" },
      error: null,
    }),
  };

  // Users select chain (fire-and-forget, returns thenable):
  //   .from('users').select('id').eq('client_id', id).eq('role', 'client').limit(1).single()
  //   This is consumed via .then() in the route -- it must be thenable
  const userSingleResult = { data: { id: "user-001" }, error: null };
  const mockUsersSelect = {
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnValue({
      then: (cb: (val: any) => any) =>
        Promise.resolve(userSingleResult).then(cb),
      catch: (cb: (err: any) => any) =>
        Promise.resolve(userSingleResult).catch(cb),
    }),
  };

  // Notification preferences select chain:
  //   .from('notification_preferences').select(...).eq('user_id', id).maybeSingle()
  //   null data = opt-out model: all channels enabled
  const mockPrefsSelect = {
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const from = vi.fn((table: string) => {
    switch (table) {
      case "subscriptions":
        return {
          upsert: mockUpsert,
          select: vi.fn().mockReturnValue(mockSubscriptionSelect),
          update: mockUpdate,
        };
      case "payments":
        return { insert: mockInsert };
      case "clients":
        return { select: vi.fn().mockReturnValue(mockClientsSelect) };
      case "users":
        return { select: vi.fn().mockReturnValue(mockUsersSelect) };
      case "notification_preferences":
        return { select: vi.fn().mockReturnValue(mockPrefsSelect) };
      default:
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          upsert: vi.fn().mockResolvedValue({ error: null }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi
            .fn()
            .mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
    }
  });

  return { from, mockUpsert, mockInsert, mockUpdate };
}

// ─── Helper: configure constructEvent mock for a given event ───────────────

function mockWebhookEvent(
  eventType: string,
  dataObject: Record<string, any>,
) {
  vi.mocked(getStripe).mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
        type: eventType,
        data: { object: dataObject },
      }),
    },
  } as any);
}

// ─── Helper: send webhook via NTARH ────────────────────────────────────────

async function sendWebhook() {
  let response: Response = undefined!;
  await testApiHandler({
    appHandler,
    requestPatcher(req) {
      req.headers.set("stripe-signature", "test-sig");
    },
    async test({ fetch }) {
      response = await fetch({ method: "POST", body: JSON.stringify({}) });
    },
  });
  return response!;
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  let mockSupabase: ReturnType<typeof buildWebhookMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");

    mockSupabase = buildWebhookMockSupabase();
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── checkout.session.completed ─────────────────────────────────────────

  it("checkout.session.completed: upserts subscription with active status", async () => {
    mockWebhookEvent("checkout.session.completed", {
      metadata: { client_id: "client-001" },
      subscription: "sub_test_123",
      customer: "cus_test_123",
    });

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockSupabase.mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-001",
        status: "active",
        stripe_subscription_id: "sub_test_123",
        stripe_customer_id: "cus_test_123",
        plan: "retainer",
      }),
    );
  });

  it("checkout.session.completed: skips upsert when no client_id in metadata", async () => {
    mockWebhookEvent("checkout.session.completed", {
      metadata: {},
      subscription: "sub_test",
      customer: "cus_test",
    });

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockSupabase.mockUpsert).not.toHaveBeenCalled();
  });

  // ── invoice.paid ──────────────────────────────────────────────────────

  it("invoice.paid: inserts payment row with status paid", async () => {
    mockWebhookEvent("invoice.paid", {
      customer: "cus_test_123",
      amount_paid: 599500,
      currency: "usd",
      id: "inv_test_123",
      payment_intent: "pi_test_123",
      period_start: 1700000000,
      hosted_invoice_url: "https://invoice.stripe.com/test",
    });

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    // Fire-and-forget: sendEmail/createNotification run asynchronously after response -- not reliably assertable
    expect(mockSupabase.mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-001",
        amount: 5995,
        status: "paid",
        stripe_invoice_id: "inv_test_123",
      }),
    );
  });

  // ── invoice.payment_failed ────────────────────────────────────────────

  it("invoice.payment_failed: inserts payment row with status failed", async () => {
    mockWebhookEvent("invoice.payment_failed", {
      customer: "cus_test_123",
      amount_due: 599500,
      currency: "usd",
      id: "inv_fail_123",
      hosted_invoice_url: "https://invoice.stripe.com/test",
    });

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);

    // Fire-and-forget: sendEmail/createNotification run asynchronously after response -- not reliably assertable
    expect(mockSupabase.mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-001",
        status: "failed",
        stripe_invoice_id: "inv_fail_123",
      }),
    );
  });

  // ── customer.subscription.deleted ────────────────────────────────────

  it("customer.subscription.deleted: updates subscription to cancelled", async () => {
    mockWebhookEvent("customer.subscription.deleted", {
      id: "sub_cancel_123",
    });

    // Capture the eq spy from the update chain for assertion
    const eqSpy = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.mockUpdate.mockReturnValue({ eq: eqSpy });

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockSupabase.mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
    expect(eqSpy).toHaveBeenCalledWith(
      "stripe_subscription_id",
      "sub_cancel_123",
    );
  });

  // ── invalid signature ─────────────────────────────────────────────────

  it("returns 400 when constructEvent throws (invalid signature)", async () => {
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error("Webhook signature verification failed");
        }),
      },
    } as any);

    const res = await sendWebhook();
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Webhook signature verification failed");
  });
});
