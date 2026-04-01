import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
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
  requests: 5,
  window: "1 m" as const,
  prefix: "rl:billing-portal",
};

export async function POST(req: Request) {
  // Rate limit (5/min for auth-adjacent routes)
  const sbSession = createServerSupabase();
  const {
    data: { user },
  } = await sbSession.auth.getUser();
  const identifier = getRateLimitIdentifier(req, user?.id);
  const rl = await rateLimit(identifier, RL_CONFIG);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const { clientId, returnUrl } = await req.json();
    const supabase = createServiceClient();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("client_id", clientId)
      .single();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url:
        returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`,
    });

    return NextResponse.json(
      { url: session.url },
      { headers: rateLimitHeaders(rl) },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400, headers: rateLimitHeaders(rl) },
    );
  }
}
