"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const readyRef = useRef(false);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("reset_password");

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        readyRef.current = true;
      }
    });
    // Fallback: if no PASSWORD_RECOVERY event after 3s, redirect to login
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        router.replace(`/${locale}/login`);
      }
    }, 3000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [locale, router]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError(t("error_min_length"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("error_mismatch"));
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push(`/${locale}/login?reset=success`);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-brand-surface border border-gray-200/60 rounded-2xl p-8 shadow-sm">
          {!ready ? (
            <div className="text-center text-sm text-brand-muted py-4">
              {t("loading")}
            </div>
          ) : success ? (
            <div className="text-center text-sm text-green-700 py-4">
              {t("success")}
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-brand-dark text-center mb-6">
                {t("title")}
              </h1>
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">
                    {t("new_password")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                    placeholder={t("new_password_placeholder")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1.5">
                    {t("confirm_password")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                    placeholder={t("confirm_placeholder")}
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-brand-red bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? t("submitting") : t("submit")}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-brand-muted mt-4">
          vantx.io
        </p>
      </div>
    </div>
  );
}
