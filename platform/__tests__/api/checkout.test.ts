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
    customers: {
      create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          url: "https://checkout.stripe.com/test-session",
        }),
      },
    },
  }),
}));

// ─── Imports AFTER mocks ──────────────────────────────────────────────────────

import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/checkout/route";
import {
  createServiceClient,
  createServerSupabase,
} from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import {
  rateLimit,
  rateLimitResponse,
  rateLimitHeaders,
} from "@/lib/rate-limit";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a chainable Supabase query mock that returns `returnValue` from .single() */
function makeChainableSingle(returnValue: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(returnValue);
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eq, single };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/checkout", () => {
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

    // Reset Stripe mock
    vi.mocked(getStripe).mockReturnValue({
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            url: "https://checkout.stripe.com/test-session",
          }),
        },
      },
    } as any);
  });

  it("returns 200 with checkout URL when customer exists", async () => {
    // Subscription row has a stripe_customer_id already
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
          body: JSON.stringify({
            clientId: "client-001",
            priceId: "price_test",
          }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.url).toBe("https://checkout.stripe.com/test-session");
      },
    });
  });

  it("creates Stripe customer when none exists and returns 200", async () => {
    // Track call count to return different responses per table
    let callCount = 0;
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "subscriptions") {
          callCount++;
          if (callCount === 1) {
            // First call: no existing customer
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Third call: update subscription with new customer id
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === "clients") {
          // Second call: fetch client name/email
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { name: "Acme", email: "acme@test.com" },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: "client-001",
            priceId: "price_test",
          }),
        });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.url).toBe("https://checkout.stripe.com/test-session");

        // Verify Stripe customer.create was called with correct params
        const stripe = getStripe();
        expect(stripe.customers.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Acme",
            email: "acme@test.com",
            metadata: { client_id: "client-001" },
          }),
        );
      },
    });
  });

  it("returns 400 when req.json() throws (malformed body)", async () => {
    // We need a valid createServiceClient so the route doesn't crash before JSON parsing
    vi.mocked(createServiceClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as any);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "not-json",
        });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json).toHaveProperty("error");
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
