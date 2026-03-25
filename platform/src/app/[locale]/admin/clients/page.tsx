"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Client, Subscription } from "@/lib/types";

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

const clientStatusColors: Record<string, string> = {
  active: "#27AE60",
  paused: "#E67E22",
  cancelled: "#C0392B",
  prospect: "#2E75B6",
};

type EnrichedClient = Client & { subscription?: Subscription; taskCount: number };

export default function AdminClientsPage() {
  const t = useTranslations("admin");
  const supabase = createClient();
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [clientsRes, subsRes, tasksRes] = await Promise.all([
        supabase.from("clients").select("*").order("name"),
        supabase.from("subscriptions").select("*").eq("status", "active"),
        supabase.from("tasks").select("id, client_id, status").not("status", "in", '("completed","cancelled")'),
      ]);

      const allClients = (clientsRes.data || []) as Client[];
      const allSubs = (subsRes.data || []) as Subscription[];
      const allTasks = (tasksRes.data || []) as { id: string; client_id: string; status: string }[];

      const enriched: EnrichedClient[] = allClients.map(c => ({
        ...c,
        subscription: allSubs.find(s => s.client_id === c.id),
        taskCount: allTasks.filter(t => t.client_id === c.id).length,
      }));

      setClients(enriched);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : clients;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">{t("clients.title")}</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("clients.search_placeholder")}
        className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-gray-200 text-sm mb-4 focus:border-brand-accent focus:outline-none"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold tracking-wide">
              <th className="px-5 py-3">{t("clients.col_name")}</th>
              <th className="px-5 py-3">{t("clients.col_status")}</th>
              <th className="px-5 py-3">{t("clients.col_plan")}</th>
              <th className="px-5 py-3">{t("clients.col_monthly")}</th>
              <th className="px-5 py-3">{t("clients.col_tasks")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition">
                <td className="px-5 py-3.5 text-[13px] font-semibold text-brand-dark">{c.name}</td>
                <td className="px-5 py-3.5">
                  <Badge text={c.status.toUpperCase()} color={clientStatusColors[c.status] || "#999"} />
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-600">
                  {c.subscription?.plan.toUpperCase() || "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] font-mono text-brand-dark">
                  {c.subscription?.price_monthly != null
                    ? `$${c.subscription.price_monthly.toLocaleString()}`
                    : "—"}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-gray-600">{c.taskCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">{t("clients.no_results")}</div>
        )}
      </div>
    </div>
  );
}
