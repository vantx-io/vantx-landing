"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Task, Client } from "@/lib/types";
import { SkeletonTable } from "@/components/skeletons";
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

const pColors: Record<string, string> = {
  critical: "#C0392B",
  high: "#E67E22",
  medium: "#2E75B6",
  low: "#999",
};
const sColors: Record<string, string> = {
  open: "#2E75B6",
  in_progress: "#E67E22",
  completed: "#27AE60",
  waiting_client: "#8E44AD",
  cancelled: "#999",
};

type TaskWithClient = Task & { clients: { name: string } | null };

export default function AdminTasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const supabase = createClient();
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [tasksRes, clientsRes] = await Promise.all([
        supabase
          .from("tasks")
          .select("*, clients(name)")
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("id, name").order("name"),
      ]);

      setTasks((tasksRes.data || []) as TaskWithClient[]);
      setClients((clientsRes.data || []) as Client[]);
    }
    load().finally(() => setLoading(false));
  }, []);

  const filtered = tasks
    .filter((t) => clientFilter === "all" || t.client_id === clientFilter)
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
    .filter((t) => statusFilter === "all" || t.status === statusFilter);

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
      <SkeletonTable rows={6} cols={6} />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark mb-6">
        {t("tasks.title")}
      </h1>

      <div className="flex gap-3 mb-4">
        {/* Client filter */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="all">{t("tasks.filter_client")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="all">{t("tasks.filter_priority")}</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
        >
          <option value="all">{t("tasks.filter_status")}</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_client">Waiting Client</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <SectionErrorBoundary fallbackTitle={tc("error_section")} fallbackBody={tc("error_section_body")} fallbackRetry={tc("error_retry")}>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold tracking-wide">
                <th className="px-5 py-3">{t("tasks.col_title")}</th>
                <th className="px-5 py-3">{t("tasks.col_client")}</th>
                <th className="px-5 py-3">{t("tasks.col_priority")}</th>
                <th className="px-5 py-3">{t("tasks.col_status")}</th>
                <th className="px-5 py-3">{t("tasks.col_assigned")}</th>
                <th className="px-5 py-3">{t("tasks.col_created")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tk) => (
                <tr
                  key={tk.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition"
                >
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-brand-dark">
                    {tk.title}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">
                    {tk.clients?.name || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      text={tk.priority.toUpperCase()}
                      color={pColors[tk.priority] || "#999"}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      text={tk.status.replace("_", " ").toUpperCase()}
                      color={sColors[tk.status] || "#999"}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">
                    {tk.assigned_to || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-400">
                    {tk.created_at?.slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {t("tasks.no_results")}
            </div>
          )}
        </div>
      </SectionErrorBoundary>
    </div>
  );
}
