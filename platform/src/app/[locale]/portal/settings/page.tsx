"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

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

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-6">{t("title")}</h1>

      <div className="bg-brand-surface rounded-xl border border-gray-200 p-6 max-w-xl">
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
    </div>
  );
}
