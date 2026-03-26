import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Hoisted mocks (variables used inside vi.mock factories must be hoisted) ─
const { mockConstructEvent, mockFrom, mockInsert } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn();
  const mockConstructEvent = vi.fn();
  return { mockConstructEvent, mockFrom, mockInsert };
});

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn().mockReturnValue({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
  formatCurrency: vi
    .fn()
    .mockImplementation((amount: number, currency: string) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
        amount,
      ),
    ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: mockFrom,
  }),
}));

// Mock onboardClient (not under test here)
vi.mock("@/lib/onboard", () => ({
  onboardClient: vi.fn().mockResolvedValue({ overall: "success", steps: [] }),
}));

import { POST } from "@/app/api/webhooks/stripe/route";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { PaymentSuccessEmail } from "@/lib/emails/PaymentSuccessEmail";
import { PaymentFailedEmail } from "@/lib/emails/PaymentFailedEmail";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: string, sig: string = "test-sig"): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: { "stripe-signature": sig },
  });
}

// ─── invoice.paid ─────────────────────────────────────────────────────────────

describe("webhook invoice.paid", () => {
  const invoicePaidEvent = {
    type: "invoice.paid",
    data: {
      object: {
        id: "inv_test123",
        customer: "cus_test123",
        amount_paid: 599500,
        currency: "usd",
        payment_intent: "pi_test123",
        period_start: 1740000000,
        hosted_invoice_url: "https://invoice.stripe.com/test",
      },
    },
  };

  const mockClient = {
    email: "client@test.com",
    name: "Acme Corp",
    market: "US",
  };

  const mockUser = { id: "user-456" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(invoicePaidEvent);

    // Chain: from('subscriptions').select(...).eq(...).single() => sub
    // Chain: from('payments').insert(...)
    // Chain: from('clients').select(...).eq(...).single() => client
    // Chain: from('users').select(...).eq(...).eq(...).limit(...).single() => user
    mockFrom.mockImplementation((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { client_id: "client-123" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return { insert: mockInsert };
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockClient, error: null }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi
                    .fn()
                    .mockResolvedValue({ data: mockUser, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notification_preferences") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn() };
    });
  });

  it("returns 200 { received: true } immediately (not blocked by email)", async () => {
    const req = makeRequest("{}");
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("calls sendEmail with to: client@test.com for US client", async () => {
    const req = makeRequest("{}");
    await POST(req);

    // Wait for fire-and-forget promises
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "client@test.com" }),
    );
  });

  it("calls sendEmail with subject containing Payment received for US (EN) client", async () => {
    const req = makeRequest("{}");
    await POST(req);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Payment received"),
      }),
    );
  });

  it("calls sendEmail with PaymentSuccessEmail react element for paid event", async () => {
    const req = makeRequest("{}");
    await POST(req);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ react: expect.anything() }),
    );
    const callArg = (sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // React element type should be PaymentSuccessEmail function
    expect(callArg.react.type).toBe(PaymentSuccessEmail);
  });

  it("calls createNotification with type payment_success", async () => {
    const req = makeRequest("{}");
    await POST(req);

    // Give fire-and-forget promises time to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "payment_success" }),
    );
  });
});

// ─── invoice.paid — LATAM client ─────────────────────────────────────────────

describe("webhook invoice.paid — LATAM client", () => {
  const invoicePaidEvent = {
    type: "invoice.paid",
    data: {
      object: {
        id: "inv_test456",
        customer: "cus_test456",
        amount_paid: 599500,
        currency: "usd",
        payment_intent: "pi_test456",
        period_start: 1740000000,
        hosted_invoice_url: "https://invoice.stripe.com/test",
      },
    },
  };

  const mockClientLatam = {
    email: "cliente@test.cl",
    name: "Empresa Ltda",
    market: "LATAM",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(invoicePaidEvent);

    mockFrom.mockImplementation((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { client_id: "client-456" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return { insert: mockInsert };
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockClientLatam, error: null }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user-789" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notification_preferences") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it("calls sendEmail with subject containing Pago recibido for LATAM client", async () => {
    const req = makeRequest("{}");
    await POST(req);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Pago recibido"),
      }),
    );
  });
});

// ─── invoice.payment_failed ───────────────────────────────────────────────────

describe("webhook invoice.payment_failed", () => {
  const invoiceFailedEvent = {
    type: "invoice.payment_failed",
    data: {
      object: {
        id: "inv_failed123",
        customer: "cus_test123",
        amount_due: 599500,
        currency: "usd",
        hosted_invoice_url: "https://invoice.stripe.com/failed",
      },
    },
  };

  const mockClient = {
    email: "client@test.com",
    name: "Acme Corp",
    market: "US",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(invoiceFailedEvent);

    mockFrom.mockImplementation((table: string) => {
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { client_id: "client-123" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "payments") {
        return { insert: mockInsert };
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockClient, error: null }),
            }),
          }),
        };
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: "user-456" },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "notification_preferences") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  it("returns 200 { received: true }", async () => {
    const req = makeRequest("{}");
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true });
  });

  it("calls sendEmail with PaymentFailedEmail react element", async () => {
    const req = makeRequest("{}");
    await POST(req);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ react: expect.anything() }),
    );
    const callArg = (sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArg.react.type).toBe(PaymentFailedEmail);
  });

  it("calls createNotification with type payment_failed", async () => {
    const req = makeRequest("{}");
    await POST(req);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: "payment_failed" }),
    );
  });
});

// ─── webhook preference enforcement (NOTIF-12) ────────────────────────────

/**
 * Build a mockFrom implementation that supports notification_preferences table
 * with the given preference data. Used for NOTIF-12 preference enforcement tests.
 */
function buildMockFromWithPrefs(
  eventType: "invoice.paid" | "invoice.payment_failed",
  prefs: { email_enabled: boolean; in_app_enabled: boolean } | null,
) {
  const mockInsertLocal = vi.fn().mockResolvedValue({ error: null });

  return vi.fn((table: string) => {
    if (table === "subscriptions") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { client_id: "client-prefs-test" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "payments") {
      return { insert: mockInsertLocal };
    }
    if (table === "clients") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                email: "client@prefs.com",
                name: "Prefs Client",
                market: "US",
              },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "users") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "user-prefs-001" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    }
    if (table === "notification_preferences") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: prefs, error: null }),
          }),
        }),
      };
    }
    return { select: vi.fn(), insert: vi.fn(), eq: vi.fn(), single: vi.fn() };
  });
}

describe("webhook invoice.paid — preference enforcement (NOTIF-12)", () => {
  const invoicePaidEvent = {
    type: "invoice.paid",
    data: {
      object: {
        id: "inv_prefs_paid",
        customer: "cus_prefs123",
        amount_paid: 599500,
        currency: "usd",
        payment_intent: "pi_prefs123",
        period_start: 1740000000,
        hosted_invoice_url: "https://invoice.stripe.com/prefs",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(invoicePaidEvent);
  });

  it("skips sendEmail when email_enabled = false (NOTIF-12)", async () => {
    mockFrom.mockImplementation(
      buildMockFromWithPrefs("invoice.paid", {
        email_enabled: false,
        in_app_enabled: true,
      }),
    );

    const req = makeRequest("{}");
    await POST(req);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendEmail).not.toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalled();
  });

  it("skips createNotification when in_app_enabled = false (NOTIF-12)", async () => {
    mockFrom.mockImplementation(
      buildMockFromWithPrefs("invoice.paid", {
        email_enabled: true,
        in_app_enabled: false,
      }),
    );

    const req = makeRequest("{}");
    await POST(req);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendEmail).toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("sends both when no preferences row (opt-out model per D-03)", async () => {
    mockFrom.mockImplementation(buildMockFromWithPrefs("invoice.paid", null));

    const req = makeRequest("{}");
    await POST(req);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendEmail).toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalled();
  });
});

describe("webhook invoice.payment_failed — preference enforcement (NOTIF-12)", () => {
  const invoiceFailedEvent = {
    type: "invoice.payment_failed",
    data: {
      object: {
        id: "inv_prefs_failed",
        customer: "cus_prefs456",
        amount_due: 599500,
        currency: "usd",
        hosted_invoice_url: "https://invoice.stripe.com/prefs-failed",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(invoiceFailedEvent);
  });

  it("skips sendEmail when email_enabled = false (NOTIF-12)", async () => {
    mockFrom.mockImplementation(
      buildMockFromWithPrefs("invoice.payment_failed", {
        email_enabled: false,
        in_app_enabled: true,
      }),
    );

    const req = makeRequest("{}");
    await POST(req);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendEmail).not.toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalled();
  });

  it("sends both when no preferences row (opt-out model per D-03)", async () => {
    mockFrom.mockImplementation(
      buildMockFromWithPrefs("invoice.payment_failed", null),
    );

    const req = makeRequest("{}");
    await POST(req);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(sendEmail).toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalled();
  });
});
