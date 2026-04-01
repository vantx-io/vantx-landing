"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Subscription, Payment } from "@/lib/types";
import { SkeletonCard, SkeletonText } from "@/components/skeletons";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: color + "18", color }}
    >
      {text}
    </span>
  );
}
const sColors: Record<string, string> = {
  active: "#27AE60",
  paused: "#E67E22",
  cancelled: "#C0392B",
  pending: "#999",
  trial: "#2E75B6",
  paid: "#27AE60",
  failed: "#C0392B",
  refunded: "#999",
};

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const supabase = createClient();
  const t = useTranslations("billing");
  const tc = useTranslations("common");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .single();
      if (!profile?.client_id) return;
      setClientId(profile.client_id);
      const { data: s } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (s) setSub(s as Subscription);
      const { data: p } = await supabase
        .from("payments")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false });
      if (p) setPayments(p as Payment[]);
    }
    load().finally(() => setDataLoading(false));
  }, []);

  async function handleCheckout() {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleBillingPortal() {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, returnUrl: window.location.href }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  function handleDownloadInvoice() {
    const lastPaid = payments.find(
      (p) => p.status === "paid" && p.stripe_invoice_id,
    );
    if (!lastPaid?.stripe_invoice_id)
      return alert(t("no_invoices"));
    window.open(
      `https://dashboard.stripe.com/invoices/${lastPaid.stripe_invoice_id}`,
      "_blank",
    );
  }

  if (dataLoading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-56 mb-6 animate-pulse" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkeletonCard /><SkeletonCard />
      </div>
      <div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse" />
      <SkeletonText lines={4} />
    </div>
  );

  const planLabel = sub ? (t.raw(`plan_labels.${sub.plan}`) as string || sub.plan) : '';

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        {t("title")}
      </h1>
      <SectionErrorBoundary fallbackTitle={tc("error_section")} fallbackBody={tc("error_section_body")} fallbackRetry={tc("error_retry")}>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-xs text-gray-500 font-semibold tracking-wide mb-2">
              {t("current_plan")}
            </div>
            {sub ? (
              <>
                <div className="text-xl font-bold text-brand-dark mb-1">
                  {planLabel}
                </div>
                <div className="flex gap-1.5 mb-4">
                  <Badge
                    text={sub.status.toUpperCase()}
                    color={sColors[sub.status]}
                  />
                  {sub.pilot_discount_pct > 0 && (
                    <Badge
                      text={`PILOT -${sub.pilot_discount_pct}%`}
                      color="#E67E22"
                    />
                  )}
                </div>
                <div className="text-3xl font-bold font-mono text-brand-accent">
                  ${sub.price_monthly}
                  <span className="text-sm text-gray-400 font-normal">
                    {t("per_month")} {sub.currency}
                  </span>
                </div>
                {sub.current_period_end && (
                  <div className="text-xs text-gray-400 mt-2">
                    {t("next_charge")}: {sub.current_period_end.slice(0, 10)}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">{t("no_subscription")}</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-xs text-gray-500 font-semibold tracking-wide mb-4">
              {t("actions")}
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="block w-full py-3 rounded-lg bg-brand-accent text-white font-semibold mb-3 hover:bg-brand-accent/90 transition disabled:opacity-50"
            >
              💳 {loading ? t("processing") : t("pay_stripe")}
            </button>
            <button
              onClick={handleDownloadInvoice}
              disabled={payments.length === 0}
              className="block w-full py-3 rounded-lg border border-gray-200 text-gray-500 mb-3 hover:bg-gray-50 transition disabled:opacity-40"
            >
              📄 {t("download_invoice")}
            </button>
            <button
              onClick={handleBillingPortal}
              disabled={loading || !sub?.stripe_customer_id}
              className="block w-full py-3 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition disabled:opacity-40"
            >
              ⚙ {t("change_plan")}
            </button>
          </div>
        </div>
      </SectionErrorBoundary>

      <h2 className="text-lg font-bold text-brand-dark mb-3">
        {t("payment_history")}
      </h2>
      <SectionErrorBoundary fallbackTitle={tc("error_section")} fallbackBody={tc("error_section_body")} fallbackRetry={tc("error_retry")}>
        {payments.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-lg px-5 py-3 border border-gray-100 mb-2 flex justify-between items-center"
          >
            <div>
              <div className="text-sm font-medium text-brand-dark">
                {p.description}
              </div>
              <div className="text-xs text-gray-400">
                {p.paid_at?.slice(0, 10) || t("pending")}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <span className="text-base font-bold font-mono text-brand-dark">
                ${p.amount}
              </span>
              <Badge text={p.status.toUpperCase()} color={sColors[p.status]} />
            </div>
          </div>
        ))}
      </SectionErrorBoundary>
    </div>
  );
}
