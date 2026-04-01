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
  prefix: "rl:checkout",
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
    const { clientId, priceId, successUrl, cancelUrl } = await req.json();
    const supabase = createServiceClient();

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("client_id", clientId)
      .single();
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const { data: client } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", clientId)
        .single();
      const customer = await getStripe().customers.create({
        name: client!.name,
        email: client!.email,
        metadata: { client_id: clientId },
      });
      customerId = customer.id;
      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("client_id", clientId);
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRICE_RETAINER_LATAM,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing?success=true`,
      cancel_url:
        cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/portal/billing`,
      metadata: { client_id: clientId },
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
