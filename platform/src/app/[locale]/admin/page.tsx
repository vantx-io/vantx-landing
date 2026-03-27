"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { SkeletonCard, SkeletonText } from "@/components/skeletons";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import type { AuditLog } from "@/lib/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex-1 min-w-[180px]">
      <div className="text-xs text-gray-500 font-semibold tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-brand-dark font-mono">
        {value}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeClients: 0,
    mrr: 0,
    openTasks: 0,
    pendingPayments: 0,
  });
  const [activity, setActivity] = useState<
    { type: string; ts: string; desc: string }[]
  >([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, subsRes, tasksRes, paymentsRes, auditRes] =
        await Promise.all([
          supabase
            .from("clients")
            .select("id, name, status, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("subscriptions")
            .select("id, client_id, plan, status, price_monthly")
            .eq("status", "active"),
          supabase
            .from("tasks")
            .select("id, title, status, client_id, updated_at")
            .order("updated_at", { ascending: false })
            .limit(20),
          supabase
            .from("payments")
            .select("id, amount, status, currency, created_at, client_id")
            .order("created_at", { ascending: false })
            .limit(20),
          (supabase as any)
            .from("audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      const clients = (clientsRes.data || []) as {
        id: string;
        name: string;
        status: string;
        created_at: string;
      }[];
      const subs = (subsRes.data || []) as {
        id: string;
        client_id: string;
        plan: string;
        status: string;
        price_monthly: number | null;
      }[];
      const tasks = (tasksRes.data || []) as {
        id: string;
        title: string;
        status: string;
        client_id: string;
        updated_at: string;
      }[];
      const payments = (paymentsRes.data || []) as {
        id: string;
        amount: number;
        status: string;
        currency: string;
        created_at: string;
        client_id: string;
      }[];

      const activeClients = clients.filter((c) => c.status === "active").length;
      const mrr = subs.reduce((acc, s) => acc + (s.price_monthly || 0), 0);
      const openTasks = tasks.filter(
        (t) => !["completed", "cancelled"].includes(t.status),
      ).length;

      const pendingPaymentsRes = await supabase
        .from("payments")
        .select("id")
        .in("status", ["pending", "failed"]);
      const pendingPayments = (pendingPaymentsRes.data || []).length;

      setStats({ activeClients, mrr, openTasks, pendingPayments });

      const events = [
        ...clients.slice(0, 20).map((c) => ({
          type: "client" as const,
          ts: c.created_at,
          desc: t("overview.event_new_client", { name: c.name }),
        })),
        ...payments.map((p) => ({
          type: "payment" as const,
          ts: p.created_at,
          desc: t("overview.event_payment", {
            status: p.status,
            amount: String(p.amount),
            client: (p as any).clients?.name || "Unknown",
          }),
        })),
        ...tasks.map((tk) => ({
          type: "task" as const,
          ts: tk.updated_at,
          desc: t("overview.event_task", {
            title: tk.title,
            status: tk.status.replace("_", " "),
          }),
        })),
      ]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 20);

      setActivity(events);

      const auditData = ((auditRes as any)?.data || []) as AuditLog[];
      setAuditLogs(auditData);

      // Enrich audit logs with actor/target names
      if (auditData.length > 0) {
        const userIds = Array.from(
          new Set(
            auditData
              .flatMap((l) => [l.actor_id, l.target_id].filter(Boolean))
              .filter((id): id is string => typeof id === "string"),
          ),
        );
        const { data: userNames } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);
        const nameMap = new Map(
          (userNames || []).map((u: any) => [u.id, u.full_name || u.email]),
        );
        setAuditLogs(
          auditData.map((l) => ({
            ...l,
            metadata: {
              ...l.metadata,
              actor_name: nameMap.get(l.actor_id) || "Admin",
              target_name: l.target_id
                ? nameMap.get(l.target_id) ||
                  (l.metadata?.email as string) ||
                  "Unknown"
                : (l.metadata?.email as string) || "Unknown",
            },
          })),
        );
      }
    }
    load().finally(() => setLoading(false));
  }, []);

  function auditActionPill(action: string): string {
    switch (action) {
      case "user.invite":
        return "bg-brand-accent/15 text-brand-accent";
      case "user.role_change":
        return "bg-brand-orange/15 text-brand-orange";
      case "user.deactivate":
        return "bg-brand-red/15 text-brand-red";
      case "user.reactivate":
        return "bg-brand-green/15 text-brand-green";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function auditActionLabel(action: string): string {
    switch (action) {
      case "user.invite":
        return "Invite";
      case "user.role_change":
        return "Role Change";
      case "user.deactivate":
        return "Deactivate";
      case "user.reactivate":
        return "Reactivate";
      default:
        return action;
    }
  }

  function formatAuditAction(log: AuditLog): string {
    const meta = log.metadata || {};
    const actor =
      (meta.actor_name as string) || (meta.email as string) || "Admin";
    const target =
      (meta.target_name as string) ||
      (meta.email as string) ||
      log.target_id ||
      "Unknown";
    const role = (meta.new_role as string) || (meta.role as string) || "";

    switch (log.action) {
      case "user.invite":
        return t("audit_log.action_invite", {
          actor,
          target: (meta.email as string) || target,
          role,
        });
      case "user.role_change":
        return t("audit_log.action_role_change", {
          actor,
          target,
          role: (meta.new_role as string) || role,
        });
      case "user.deactivate":
        return t("audit_log.action_deactivate", { actor, target });
      case "user.reactivate":
        return t("audit_log.action_reactivate", { actor, target });
      default:
        return `${actor}: ${log.action}`;
    }
  }

  if (loading)
    return (
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="flex gap-4 mb-6 flex-wrap">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <SkeletonText lines={5} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
          <SkeletonText lines={5} />
        </div>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        {t("overview.title")}
      </h1>

      <SectionErrorBoundary
        fallbackTitle={tc("error_section")}
        fallbackBody={tc("error_section_body")}
        fallbackRetry={tc("error_retry")}
      >
        <div className="flex gap-4 mb-6 flex-wrap">
          <StatCard
            label={t("overview.active_clients")}
            value={stats.activeClients}
          />
          <StatCard
            label={t("overview.current_mrr")}
            value={`$${stats.mrr.toLocaleString()}`}
          />
          <StatCard label={t("overview.open_tasks")} value={stats.openTasks} />
          <StatCard
            label={t("overview.pending_payments")}
            value={stats.pendingPayments}
          />
        </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        fallbackTitle={tc("error_section")}
        fallbackBody={tc("error_section_body")}
        fallbackRetry={tc("error_retry")}
      >
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-brand-dark mb-4">
            {t("overview.recent_activity")}
          </h2>
          {activity.map((evt, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-base mt-0.5">
                {evt.type === "client"
                  ? "👤"
                  : evt.type === "payment"
                    ? "💰"
                    : "📋"}
              </span>
              <div className="flex-1">
                <div className="text-[13px] text-brand-dark">{evt.desc}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(evt.ts).toLocaleString("en-US")}
                </div>
              </div>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">
              No recent activity.
            </div>
          )}
        </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary
        fallbackTitle={tc("error_section")}
        fallbackBody={tc("error_section_body")}
        fallbackRetry={tc("error_retry")}
      >
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-6">
          <h2 className="text-sm font-bold text-brand-dark mb-4">
            {t("audit_log.title")}
          </h2>
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
            >
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap mt-0.5 ${auditActionPill(log.action)}`}
              >
                {auditActionLabel(log.action)}
              </span>
              <div className="flex-1">
                <div className="text-[13px] text-brand-dark">
                  {formatAuditAction(log)}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(log.created_at).toLocaleString("en-US")}
                </div>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-6">
              {t("audit_log.empty")}
            </div>
          )}
        </div>
      </SectionErrorBoundary>
    </div>
  );
}
