"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type { User, Client } from "@/lib/types";

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

const roleColors: Record<string, string> = {
  admin: "#C0392B",
  engineer: "#2E75B6",
  seller: "#27AE60",
  client: "#999999",
};

const statusColors: Record<string, string> = {
  active: "#27AE60",
  deactivated: "#C0392B",
};

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("client");
  const [inviteClientId, setInviteClientId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    const [usersRes, clientsRes] = await Promise.all([
      supabase.from("users").select("*").order("full_name"),
      supabase.from("clients").select("id, name").order("name"),
    ]);
    setUsers((usersRes.data || []) as User[]);
    setClients((clientsRes.data || []) as Client[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  async function handleInvite() {
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          client_id: inviteRole === "client" ? inviteClientId || null : null,
        }),
      });
      if (res.status === 201) {
        const data = await res.json();
        setInviteSuccess(
          t("users.invite_success", { email: data.email || inviteEmail })
        );
        setInviteEmail("");
        setInviteRole("client");
        setInviteClientId("");
        setShowInviteForm(false);
        await loadData();
      } else if (res.status === 409) {
        setInviteError(t("users.invite_error_duplicate"));
      } else {
        setInviteError(t("users.invite_error_failed"));
      }
    } catch {
      setInviteError(t("users.invite_error_failed"));
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(
    userId: string,
    newRole: string,
    clientId?: string
  ) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: newRole,
        client_id: clientId || undefined,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );
      setFeedback(t("users.role_change_success"));
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function handleToggleStatus(userId: string, isActive: boolean) {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
    });
    if (res.ok) {
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...data.user } : u))
      );
      const msg = isActive
        ? t("users.deactivate_success")
        : t("users.reactivate_success");
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">
          {t("users.title")}
        </h1>
        <button
          onClick={() => {
            setShowInviteForm((v) => !v);
            setInviteError(null);
            setInviteSuccess(null);
          }}
          className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition"
        >
          {t("users.invite_button")}
        </button>
      </div>

      {/* Feedback toasts */}
      {feedback && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {feedback}
        </div>
      )}
      {inviteSuccess && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {inviteSuccess}
        </div>
      )}

      {/* Inline invite form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-xs text-gray-500 font-semibold">
                {t("users.invite_form_email")}
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@company.com"
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">
                {t("users.invite_form_role")}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-accent focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="engineer">Engineer</option>
                <option value="seller">Seller</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-semibold">
                {t("users.invite_form_client")}
              </label>
              <select
                value={inviteClientId}
                onChange={(e) => setInviteClientId(e.target.value)}
                disabled={inviteRole !== "client"}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-brand-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Select client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={inviteLoading || !inviteEmail}
                className="px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {inviteLoading ? "..." : t("users.invite_form_submit")}
              </button>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteError(null);
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                {t("users.invite_form_cancel")}
              </button>
            </div>
          </div>
          {inviteError && (
            <div className="mt-2 text-sm text-red-600">{inviteError}</div>
          )}
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("users.search_placeholder")}
        className="w-full max-w-sm px-4 py-2.5 rounded-lg border border-gray-200 text-sm mb-4 focus:border-brand-accent focus:outline-none"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-500 font-semibold tracking-wide">
              <th className="px-5 py-3">{t("users.col_name")}</th>
              <th className="px-5 py-3">{t("users.col_email")}</th>
              <th className="px-5 py-3">{t("users.col_role")}</th>
              <th className="px-5 py-3">{t("users.col_client")}</th>
              <th className="px-5 py-3">{t("users.col_status")}</th>
              <th className="px-5 py-3">{t("users.col_created")}</th>
              <th className="px-5 py-3">{t("users.col_actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const clientName =
                clients.find((c) => c.id === u.client_id)?.name || "—";
              const statusKey = u.is_active ? "active" : "deactivated";
              return (
                <tr
                  key={u.id}
                  className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition ${
                    !u.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-brand-dark">
                    {u.full_name}
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      text={u.role.toUpperCase()}
                      color={roleColors[u.role] || "#999999"}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">
                    {clientName}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      text={statusKey.toUpperCase()}
                      color={statusColors[statusKey]}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-400">
                    {u.created_at?.slice(0, 10)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Role change dropdown */}
                      <select
                        value={u.role}
                        onChange={(e) =>
                          handleRoleChange(u.id, e.target.value)
                        }
                        className="px-2 py-1 rounded border border-gray-200 text-[12px] text-gray-700 focus:border-brand-accent focus:outline-none"
                        title={t("users.action_change_role")}
                      >
                        <option value="admin">Admin</option>
                        <option value="engineer">Engineer</option>
                        <option value="seller">Seller</option>
                        <option value="client">Client</option>
                      </select>
                      {/* Deactivate / Reactivate */}
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded text-[12px] font-semibold transition ${
                          u.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {u.is_active
                          ? t("users.action_deactivate")
                          : t("users.action_reactivate")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            {t("users.no_results")}
          </div>
        )}
      </div>
    </div>
  );
}
