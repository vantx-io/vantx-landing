import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mocks must be declared BEFORE route imports ─────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabase: vi.fn(),
  createServiceClient: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 60000,
  }),
  getRateLimitIdentifier: vi.fn().mockReturnValue("ip:test"),
  rateLimitResponse: vi.fn(),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn().mockReturnValue({
    billingPortal: {
      sessions: {
        create: vi
          .fn()
          .mockResolvedValue({ url: "https://billing.stripe.com/test-session" }),
      },
    },
  }),
}));

// ─── Imports AFTER mocks ──────────────────────────────────────────────────────

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/billing-portal/route";
import {
  createServiceClient,
  createServerSupabase,
} from "@/lib/supabase/server";
import { rateLimit, rateLimitResponse, rateLimitHeaders } from "@/lib/rate-limit";

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/billing-portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset rate limit mock to success state
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
    });

    // Reset rateLimitHeaders to return empty object
    vi.mocked(rateLimitHeaders).mockReturnValue({});

    // Auth: return a valid user
    vi.mocked(createServerSupabase).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-001" } },
          error: null,
        }),
      },
    } as any);
  });

  it("returns 200 with billing portal URL when customer exists", async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { stripe_customer_id: "cus_existing" },
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: "client-001" }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.url).toBe("https://billing.stripe.com/test-session");
      },
    });
  });

  it("returns 400 when no Stripe customer found", async () => {
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: "client-001" }),
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe("No Stripe customer found");
      },
    });
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    vi.mocked(rateLimitResponse).mockReturnValueOnce(
      new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
      }),
    );

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: "client-001" }),
        });
        expect(res.status).toBe(429);
      },
    });
  });
});
