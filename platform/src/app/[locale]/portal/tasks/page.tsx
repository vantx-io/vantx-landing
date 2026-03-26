"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskComment } from "@/lib/types";
import CommentForm from "./CommentForm";
import AttachmentPreview from "./AttachmentPreview";
import { SkeletonTable } from "@/components/skeletons";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newTask, setNewTask] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    type: "request",
  });
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const locale = useLocale();
  const t = useTranslations("tasks");
  const tc = useTranslations("common");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("client_id")
        .eq("id", user.id)
        .single();
      if (!profile?.client_id) return;
      setClientId(profile.client_id);
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false });
      if (data) setTasks(data as Task[]);
    }
    load().finally(() => setLoading(false));
  }, []);

  async function loadComments(taskId: string) {
    setSelected(selected === taskId ? null : taskId);
    if (selected === taskId) return;
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as TaskComment[]);
  }

  async function reloadComments(taskId: string) {
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (data) setComments(data as TaskComment[]);
  }

  async function updateTask(
    taskId: string,
    updates: { title?: string; status?: string },
  ) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", clientId!)
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  }

  async function createTask() {
    if (!form.title.trim() || !clientId) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        type: form.type,
        created_by: userId,
      }),
    });
    if (!res.ok) {
      console.error("[tasks] create failed:", await res.text());
      return;
    }
    setNewTask(false);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      type: "request",
    });
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  }

  if (loading) return (
    <div>
      <div className="h-8 bg-gray-200 rounded w-40 mb-1 animate-pulse" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-6 animate-pulse" />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );

  const filtered =
    filter === "all" ? tasks : tasks.filter((tk) => tk.status === filter);
  const filters: [string, string][] = [
    ["all", t("filters.all")],
    ["open", t("filters.open")],
    ["in_progress", t("filters.in_progress")],
    ["completed", t("filters.completed")],
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">{t("title")}</h1>
        <button
          onClick={() => setNewTask(!newTask)}
          className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent/90 transition"
        >
          {t("new_request")}
        </button>
      </div>

      {newTask && (
        <div className="bg-white rounded-xl p-6 border-2 border-brand-accent mb-4">
          <h3 className="font-bold text-brand-dark mb-3">
            {t("new_request_title")}
          </h3>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("form.title_placeholder")}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:border-brand-accent focus:outline-none"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t("form.description_placeholder")}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3 focus:border-brand-accent focus:outline-none"
          />
          <div className="flex gap-3 mb-4">
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="low">{t("form.priority.low")}</option>
              <option value="medium">{t("form.priority.medium")}</option>
              <option value="high">{t("form.priority.high")}</option>
              <option value="critical">{t("form.priority.critical")}</option>
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="request">{t("form.type.request")}</option>
              <option value="incident">{t("form.type.incident")}</option>
              <option value="optimization">
                {t("form.type.optimization")}
              </option>
              <option value="investigation">
                {t("form.type.investigation")}
              </option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createTask}
              className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold"
            >
              {t("form.create")}
            </button>
            <button
              onClick={() => setNewTask(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500"
            >
              {t("form.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {filters.map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
              filter === k
                ? "border-brand-accent bg-blue-50 text-brand-accent font-bold"
                : "border-gray-200 bg-white text-gray-500"
            }`}
          >
            {v}{" "}
            {k !== "all" && (
              <span className="ml-1 text-gray-400">
                ({tasks.filter((tk) => k === "all" || tk.status === k).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <SectionErrorBoundary fallbackTitle={tc("error_section")} fallbackBody={tc("error_section_body")} fallbackRetry={tc("error_retry")}>
        {filtered.map((tk) => (
          <div
            key={tk.id}
            className="bg-white rounded-xl border border-gray-100 mb-2.5 overflow-hidden"
          >
            <div
              className="px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition"
              onClick={() => loadComments(tk.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  {editingTitle === tk.id ? (
                    <div
                      className="flex items-center gap-2 mb-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateTask(tk.id, { title: editTitleValue });
                            setEditingTitle(null);
                          }
                          if (e.key === "Escape") setEditingTitle(null);
                        }}
                        className="text-[14px] font-semibold text-brand-dark px-2 py-1 rounded border border-brand-accent focus:outline-none"
                        autoFocus
                        aria-label={t("edit_title")}
                      />
                      <button
                        onClick={() => {
                          updateTask(tk.id, { title: editTitleValue });
                          setEditingTitle(null);
                        }}
                        className="text-xs text-brand-accent font-semibold"
                        type="button"
                      >
                        {t("save_title")}
                      </button>
                    </div>
                  ) : (
                    <div
                      className="text-[14px] font-semibold text-brand-dark mb-1.5 cursor-pointer hover:text-brand-accent transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitle(tk.id);
                        setEditTitleValue(tk.title);
                      }}
                      title={t("edit_title")}
                      role="button"
                      tabIndex={0}
                    >
                      {tk.title}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Badge
                      text={tk.priority.toUpperCase()}
                      color={pColors[tk.priority]}
                    />
                    <Badge
                      text={tk.status.replace("_", " ").toUpperCase()}
                      color={sColors[tk.status]}
                    />
                    <Badge text={tk.type.toUpperCase()} color="#999" />
                  </div>
                </div>
                <div className="text-right">
                  {tk.due_date && (
                    <div className="text-[12px] text-gray-400">
                      {t("due")}: {tk.due_date}
                    </div>
                  )}
                  <div className="text-[12px] text-brand-accent mt-1">
                    {t("view_comments")}
                  </div>
                </div>
              </div>
              {tk.description && (
                <p className="text-sm text-gray-500 mt-2">{tk.description}</p>
              )}
            </div>

            {selected === tk.id && (
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                {/* Status change dropdown */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-gray-500 font-medium">
                    {t("change_status")}:
                  </span>
                  <select
                    value={tk.status}
                    onChange={(e) =>
                      updateTask(tk.id, { status: e.target.value })
                    }
                    className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:border-brand-accent focus:outline-none"
                    aria-label={t("change_status")}
                  >
                    <option value="open">{t("filters.open")}</option>
                    <option value="in_progress">
                      {t("filters.in_progress")}
                    </option>
                    <option value="waiting_client">Waiting Client</option>
                    <option value="completed">{t("filters.completed")}</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {comments.length === 0 && (
                  <p className="text-sm text-gray-400 mb-3">{t("no_comments")}</p>
                )}
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="mb-3 p-3 bg-white rounded-lg border border-gray-100"
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(c.created_at).toLocaleString(
                        locale === "es" ? "es-CL" : "en-US",
                      )}
                    </div>
                    <div className="text-sm text-gray-700">{c.content}</div>
                    {c.attachments && c.attachments.length > 0 && (
                      <AttachmentPreview attachments={c.attachments} />
                    )}
                  </div>
                ))}
                <CommentForm
                  taskId={tk.id}
                  clientId={clientId!}
                  userId={userId!}
                  onCommentAdded={() => reloadComments(tk.id)}
                />
              </div>
            )}
          </div>
        ))}
      </SectionErrorBoundary>
    </div>
  );
}
