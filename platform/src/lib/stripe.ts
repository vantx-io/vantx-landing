import Stripe from "stripe";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}

export function getPriceId(
  plan: string,
  market: "US" | "LATAM",
  isPilot: boolean = false,
): string {
  const key = isPilot
    ? `STRIPE_PRICE_${plan.toUpperCase()}_PILOT_${market}`
    : `STRIPE_PRICE_${plan.toUpperCase()}_${market}`;
  return process.env[key] || "";
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}

export async function getOrCreateCustomer(
  stripeCustomerId: string | null,
  name: string,
  email: string,
  clientId: string,
): Promise<string> {
  if (stripeCustomerId) return stripeCustomerId;
  const customer = await getStripe().customers.create({
    name,
    email,
    metadata: { client_id: clientId },
  });
  return customer.id;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
) {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
