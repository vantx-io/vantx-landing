"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type PrefsState = {
  email_enabled: boolean;
  in_app_enabled: boolean;
  digest_enabled: boolean;
};

const DEFAULT_PREFS: PrefsState = {
  email_enabled: true,
  in_app_enabled: true,
  digest_enabled: true,
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [prefs, setPrefs] = useState<PrefsState>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Profile state (AUTH-03)
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security state (AUTH-02)
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setPrefs({
          email_enabled: data.email_enabled !== false,
          in_app_enabled: data.in_app_enabled !== false,
          digest_enabled: data.digest_enabled !== false,
        });
      } catch {
        setError(t("error_load"));
      } finally {
        setLoading(false);
      }
    }
    loadPrefs();
  }, [t]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setProfileName(data.full_name || "");
        setProfileEmail(data.email || "");
      } catch {
        setProfileError(t("error_load"));
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, [t]);

  async function handleToggle(field: keyof PrefsState) {
    const currentValue = prefs[field];
    // Optimistic update
    setPrefs((prev) => ({ ...prev, [field]: !prev[field] }));
    setSaveError(null);

    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      // Rollback on failure
      setPrefs((prev) => ({ ...prev, [field]: currentValue }));
      setSaveError(t("error_save"));
      setTimeout(() => setSaveError(null), 4000);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: profileName }),
      });
      if (!res.ok) throw new Error("save failed");
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 4000);
    } catch {
      setProfileError(t("error_save"));
      setTimeout(() => setProfileError(null), 4000);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwError(t("error_pw_min"));
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(t("error_pw_mismatch"));
      return;
    }
    setPwLoading(true);
    setPwError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
      return;
    }
    setNewPw("");
    setConfirmPw("");
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 4000);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">{t("title")}</h1>

      {/* Profile section */}
      <div className="bg-brand-surface rounded-xl border border-gray-200 p-6 max-w-xl mb-6">
        <h2 className="text-base font-semibold text-[#1A1A17] mb-4">
          {t("profile_heading")}
        </h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              {t("name_label")}
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={profileLoading}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              {t("email_readonly_label")}
            </label>
            <p className="px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-brand-muted text-sm">
              {profileEmail}
            </p>
          </div>
          {profileError && (
            <p className="text-[11px] text-brand-red" role="alert">
              {profileError}
            </p>
          )}
          {profileSaved && (
            <p className="text-[11px] text-green-600" role="status">
              {t("saved")}
            </p>
          )}
          <button
            type="submit"
            disabled={profileSaving || profileLoading}
            className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {profileSaving ? t("saving") : t("save")}
          </button>
        </form>
      </div>

      {/* Notifications section */}
      <div className="bg-brand-surface rounded-xl border border-gray-200 p-6 max-w-xl mb-6">
        <h2 className="text-base font-semibold text-[#1A1A17] mb-4">
          {t("notifications_heading")}
        </h2>

        {error && (
          <p className="text-sm text-brand-red mb-4" role="alert">
            {error}
          </p>
        )}

        {/* Email notifications */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex flex-col">
            <span className="text-sm text-[#1A1A17]">{t("email_label")}</span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              {t("email_description")}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.email_enabled}
            aria-label={t("email_label")}
            onClick={() => handleToggle("email_enabled")}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
              prefs.email_enabled ? "bg-brand-accent" : "bg-[#D1D5DB]"
            } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                prefs.email_enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* In-app notifications */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex flex-col">
            <span className="text-sm text-[#1A1A17]">
              {t("in_app_label")}
            </span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              {t("in_app_description")}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.in_app_enabled}
            aria-label={t("in_app_label")}
            onClick={() => handleToggle("in_app_enabled")}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
              prefs.in_app_enabled ? "bg-brand-accent" : "bg-[#D1D5DB]"
            } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                prefs.in_app_enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Weekly digest */}
        <div className="flex items-center justify-between py-3">
          <div className="flex flex-col">
            <span className="text-sm text-[#1A1A17]">
              {t("digest_label")}
            </span>
            <span className="text-[11px] text-brand-muted mt-0.5">
              {t("digest_description")}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.digest_enabled}
            aria-label={t("digest_label")}
            onClick={() => handleToggle("digest_enabled")}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 ${
              prefs.digest_enabled ? "bg-brand-accent" : "bg-[#D1D5DB]"
            } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                prefs.digest_enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {saveError && (
          <p className="text-[11px] text-brand-red mt-1" role="alert">
            {saveError}
          </p>
        )}
      </div>

      {/* Security section */}
      <div className="bg-brand-surface rounded-xl border border-gray-200 p-6 max-w-xl">
        <h2 className="text-base font-semibold text-[#1A1A17] mb-4">
          {t("security_heading")}
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              {t("new_password")}
            </label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
              placeholder={t("new_password_placeholder")}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              {t("confirm_password")}
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
              placeholder={t("confirm_placeholder")}
            />
          </div>
          {pwError && (
            <p className="text-[11px] text-brand-red" role="alert">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-[11px] text-green-600" role="status">
              {t("pw_success")}
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {pwLoading ? t("pw_submitting") : t("pw_submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
