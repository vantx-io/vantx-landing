import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, formatCurrency } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { onboardClient } from "@/lib/onboard";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { PaymentSuccessEmail } from "@/lib/emails/PaymentSuccessEmail";
import { PaymentFailedEmail } from "@/lib/emails/PaymentFailedEmail";
import React from "react";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const clientId = session.metadata?.client_id;
      if (!clientId) break;
      await supabase.from("subscriptions").upsert({
        client_id: clientId,
        plan: "retainer",
        status: "active",
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        current_period_start: new Date().toISOString(),
      });
      // Fire-and-forget: provision Grafana stack, Slack channel, update client
      onboardClient(clientId, supabase)
        .then((r) =>
          console.log(
            `[onboard] ${r.overall} for ${clientId} (${r.steps.length} steps)`,
          ),
        )
        .catch((err) => console.error(`[onboard] Error for ${clientId}:`, err));
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("client_id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (sub) {
        await supabase.from("payments").insert({
          client_id: sub.client_id,
          amount: (invoice.amount_paid || 0) / 100,
          currency: invoice.currency?.toUpperCase() || "USD",
          status: "paid",
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id: invoice.payment_intent as string,
          description: `Retainer SRE — ${new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`,
          paid_at: new Date().toISOString(),
        });

        // Fire-and-forget: payment success email + notification (per D-02, D-05, D-06, D-09, D-10)
        const { data: client } = await supabase
          .from("clients")
          .select("email, name, market")
          .eq("id", sub.client_id)
          .single();
        if (client) {
          const locale = client.market === "LATAM" ? "es" : "en";
          const amount = formatCurrency(
            (invoice.amount_paid || 0) / 100,
            invoice.currency?.toUpperCase() || "USD",
          );
          const period = new Date(
            (invoice.period_start || 0) * 1000,
          ).toLocaleDateString(locale === "es" ? "es-CL" : "en-US", {
            month: "long",
            year: "numeric",
          });
          const billingUrl = invoice.hosted_invoice_url || "";

          // Check preferences before sending (NOTIF-12, D-23)
          supabase
            .from("users")
            .select("id")
            .eq("client_id", sub.client_id)
            .eq("role", "client")
            .limit(1)
            .single()
            .then(async ({ data: user }) => {
              if (!user) return;

              // Preference lookup — opt-out model (null = send)
              const { data: prefs } = await supabase
                .from("notification_preferences")
                .select("email_enabled, in_app_enabled")
                .eq("user_id", user.id)
                .maybeSingle();

              const emailEnabled = prefs?.email_enabled !== false;
              const inAppEnabled = prefs?.in_app_enabled !== false;

              if (emailEnabled) {
                sendEmail({
                  to: client.email,
                  subject:
                    locale === "es" ? "Pago recibido" : "Payment received",
                  react: React.createElement(PaymentSuccessEmail, {
                    locale,
                    clientName: client.name,
                    amount,
                    currency: invoice.currency?.toUpperCase() || "USD",
                    period,
                    billingPortalUrl: billingUrl,
                  }),
                }).catch((err) =>
                  console.error("[email] invoice.paid error:", err),
                );
              }

              if (inAppEnabled) {
                createNotification(supabase, {
                  userId: user.id,
                  type: "payment_success",
                  title: locale === "es" ? "Pago recibido" : "Payment received",
                  body:
                    locale === "es"
                      ? `Recibimos tu pago de ${amount}`
                      : `We received your ${amount} payment`,
                  actionLink: billingUrl || undefined,
                }).catch((err) =>
                  console.error(
                    "[notify] payment_success notification error:",
                    err,
                  ),
                );
              }
            })
            .catch((err) => console.error("[notify] user lookup error:", err));
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("client_id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (sub) {
        await supabase.from("payments").insert({
          client_id: sub.client_id,
          amount: (invoice.amount_due || 0) / 100,
          status: "failed",
          stripe_invoice_id: invoice.id,
          description: "Pago fallido",
        });

        // Fire-and-forget: payment failed email + notification (per D-02, D-05, D-06, D-09, D-10)
        const { data: client } = await supabase
          .from("clients")
          .select("email, name, market")
          .eq("id", sub.client_id)
          .single();
        if (client) {
          const locale = client.market === "LATAM" ? "es" : "en";
          const amount = formatCurrency(
            (invoice.amount_due || 0) / 100,
            invoice.currency?.toUpperCase() || "USD",
          );
          const billingUrl = invoice.hosted_invoice_url || "";

          // Check preferences before sending (NOTIF-12, D-23)
          supabase
            .from("users")
            .select("id")
            .eq("client_id", sub.client_id)
            .eq("role", "client")
            .limit(1)
            .single()
            .then(async ({ data: user }) => {
              if (!user) return;

              // Preference lookup — opt-out model (null = send)
              const { data: prefs } = await supabase
                .from("notification_preferences")
                .select("email_enabled, in_app_enabled")
                .eq("user_id", user.id)
                .maybeSingle();

              const emailEnabled = prefs?.email_enabled !== false;
              const inAppEnabled = prefs?.in_app_enabled !== false;

              if (emailEnabled) {
                sendEmail({
                  to: client.email,
                  subject:
                    locale === "es" ? "Problema con el pago" : "Payment issue",
                  react: React.createElement(PaymentFailedEmail, {
                    locale,
                    clientName: client.name,
                    amount,
                    currency: invoice.currency?.toUpperCase() || "USD",
                    billingPortalUrl: billingUrl,
                  }),
                }).catch((err) =>
                  console.error("[email] invoice.payment_failed error:", err),
                );
              }

              if (inAppEnabled) {
                createNotification(supabase, {
                  userId: user.id,
                  type: "payment_failed",
                  title:
                    locale === "es" ? "Problema con el pago" : "Payment issue",
                  body:
                    locale === "es"
                      ? `No pudimos procesar tu pago de ${amount}`
                      : `We couldn't process your ${amount} payment`,
                  actionLink: billingUrl || undefined,
                }).catch((err) =>
                  console.error(
                    "[notify] payment_failed notification error:",
                    err,
                  ),
                );
              }
            })
            .catch((err) => console.error("[notify] user lookup error:", err));
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
