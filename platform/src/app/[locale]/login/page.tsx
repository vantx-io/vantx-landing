"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("login");
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setResetSuccess(true);
      const timer = setTimeout(() => setResetSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(`/${locale}/portal`);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    const origin = window.location.origin;
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${origin}/${locale}/reset-password`,
    });
    // Always show success — prevents user enumeration
    setForgotSent(true);
    setForgotLoading(false);
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-brand-surface border border-gray-200/60 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-center mb-8">
            <Image
              src="/vantx-logo.png"
              alt="Vantx"
              width={140}
              height={40}
              className="h-9 w-auto"
            />
          </div>

          {resetSuccess && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {t("reset_success")}
            </div>
          )}

          <h1 className="text-xl font-semibold text-brand-dark text-center mb-1">
            {t("title")}
          </h1>
          <p className="text-sm text-brand-muted text-center mb-6">
            {t("subtitle")}
          </p>

          {!showForgot ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                  placeholder={t("email_placeholder")}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                  placeholder={t("password_placeholder")}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgot(true);
                  }}
                  className="text-xs text-brand-accent hover:text-brand-accent-hover transition"
                >
                  {t("forgot_password")}
                </button>
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
          ) : forgotSent ? (
            <div className="space-y-4">
              <div className="text-sm text-brand-dark bg-green-50 border border-green-100 rounded-lg px-3 py-3">
                {t("forgot_email_sent")}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setForgotSent(false);
                }}
                className="w-full text-sm text-brand-accent hover:text-brand-accent-hover transition"
              >
                {t("forgot_back")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-brand-muted">{t("forgot_prompt")}</p>
              <div>
                <label className="block text-xs font-medium text-brand-muted mb-1.5">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 bg-white text-brand-dark text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition"
                  placeholder={t("email_placeholder")}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full h-11 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                {forgotLoading ? t("forgot_sending") : t("forgot_send")}
              </button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-sm text-brand-accent hover:text-brand-accent-hover transition"
              >
                {t("forgot_back")}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-brand-muted mt-4">
          vantx.io
        </p>
      </div>
    </div>
  );
}
