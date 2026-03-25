"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Payment, Subscription } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex-1 min-w-[180px]">
      <div className="text-xs text-gray-500 font-semibold tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-brand-dark font-mono">{value}</div>
    </div>
  );
}

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

type PaymentWithClient = Payment & { clients: { name: string } | null };
type SubWithClient = Subscription & { clients: { name: string } | null };

export default function AdminBillingPage() {
  const [stats, setStats] = useState({
    mrr: 0,
    activeSubs: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [payments, setPayments] = useState<PaymentWithClient[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubWithClient[]>([]);
  const supabase = createClient();
  const t = useTranslations("admin");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [paymentsRes, subsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("*, clients(name)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("subscriptions")
          .select("*, clients(name)")
          .order("created_at", { ascending: false }),
      ]);

      const allPayments = (paymentsRes.data || []) as PaymentWithClient[];
      const allSubs = (subsRes.data || []) as SubWithClient[];
      const activeSubs = allSubs.filter((s) => s.status === "active");

      setPayments(allPayments);
      setSubscriptions(activeSubs);
      setStats({
        mrr: activeSubs.reduce((acc, s) => acc + (s.price_monthly || 0), 0),
        activeSubs: activeSubs.length,
        pendingPayments: allPayments.filter((p) => p.status === "pending")
          .length,
        failedPayments: allPayments.filter((p) => p.status === "failed").length,
      });
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        {t("billing.title")}
      </h1>

      {/* 4 Stat Cards */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <StatCard
          label={t("billing.total_mrr")}
          value={`$${stats.mrr.toLocaleString()}`}
        />
        <StatCard
          label={t("billing.active_subscriptions")}
          value={stats.activeSubs}
        />
        <StatCard
          label={t("billing.pending_payments")}
          value={stats.pendingPayments}
        />
        <StatCard
          label={t("billing.failed_payments")}
          value={stats.failedPayments}
        />
      </div>

      {/* Recent Payments Table */}
      <h2 className="text-lg font-bold text-brand-dark mb-3">
        {t("billing.recent_payments")}
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold tracking-wide">
              <th className="px-5 py-3">{t("billing.col_client")}</th>
              <th className="px-5 py-3">{t("billing.col_amount")}</th>
              <th className="px-5 py-3">{t("billing.col_currency")}</th>
              <th className="px-5 py-3">{t("billing.col_status")}</th>
              <th className="px-5 py-3">{t("billing.col_date")}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
              >
                <td className="px-5 py-3.5 text-[13px] text-brand-dark">
                  {p.clients?.name || "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-mono font-semibold text-brand-dark">
                  ${p.amount.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-600">
                  {p.currency}
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    text={p.status.toUpperCase()}
                    color={sColors[p.status] || "#999"}
                  />
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-400">
                  {p.created_at?.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            {t("billing.no_payments")}
          </div>
        )}
      </div>

      {/* Active Subscriptions Table */}
      <h2 className="text-lg font-bold text-brand-dark mb-3">
        {t("billing.active_subs_table")}
      </h2>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold tracking-wide">
              <th className="px-5 py-3">{t("billing.col_client")}</th>
              <th className="px-5 py-3">{t("billing.col_plan")}</th>
              <th className="px-5 py-3">{t("billing.col_status")}</th>
              <th className="px-5 py-3">{t("billing.col_monthly")}</th>
              <th className="px-5 py-3">{t("billing.col_period_end")}</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
              >
                <td className="px-5 py-3.5 text-[13px] text-brand-dark">
                  {s.clients?.name || "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-600">
                  {s.plan.toUpperCase()}
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    text={s.status.toUpperCase()}
                    color={sColors[s.status] || "#999"}
                  />
                </td>
                <td className="px-5 py-3.5 text-[13px] font-mono font-semibold text-brand-dark">
                  {s.price_monthly != null
                    ? `$${s.price_monthly.toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-400">
                  {s.current_period_end?.slice(0, 10) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subscriptions.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            {t("billing.no_subscriptions")}
          </div>
        )}
      </div>
    </div>
  );
}
