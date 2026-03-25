"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { Client, Subscription, User } from "@/lib/types";
import { NotificationBell } from "@/components/NotificationBell";

const navKeys = [
  { id: "portal", key: "dashboard", segment: "" },
  { id: "tests", key: "tests", segment: "/tests" },
  { id: "reports", key: "reports", segment: "/reports" },
  { id: "tasks", key: "tasks", segment: "/tasks" },
  { id: "grafana", key: "grafana", segment: "/grafana" },
  { id: "billing", key: "billing", segment: "/billing" },
  { id: "services", key: "services", segment: "/services" },
  { id: "tutorials", key: "tutorials", segment: "/tutorials" },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [subscription, setSub] = useState<Subscription | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const supabase = createClient();

  const portalBase = `/${locale}/portal`;

  useEffect(() => {
    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push(`/${locale}/login`);
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();
      if (profile) {
        setUser(profile as User);
        if (profile.client_id) {
          const { data: c } = await supabase
            .from("clients")
            .select("*")
            .eq("id", profile.client_id)
            .single();
          if (c) setClient(c as Client);
          const { data: s } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("client_id", profile.client_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (s) setSub(s as Subscription);
        }
      }
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  function switchLocale() {
    const newLocale = locale === "es" ? "en" : "es";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-sidebar text-[#A3A39B] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <Image
              src="/vantx-logo-white.png"
              alt="Vantx"
              width={120}
              height={32}
              className="h-7 w-auto"
            />
          </div>
          {client && (
            <>
              <div className="text-white text-sm font-semibold mt-1">
                {client.name}
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {subscription && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-accent/20 text-brand-accent">
                    {subscription.plan.toUpperCase()}
                  </span>
                )}
                {client.is_pilot && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-orange/20 text-orange-400">
                    {tc("pilot")}
                  </span>
                )}
              </div>
            </>
          )}
          <div className="flex items-center justify-between mt-2">
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 py-3">
          {navKeys.map((n) => {
            const href = `${portalBase}${n.segment}`;
            const active =
              pathname === href ||
              (n.segment !== "" && pathname.startsWith(href));
            return (
              <button
                key={n.id}
                onClick={() => router.push(href)}
                className={`flex items-center gap-2.5 w-full px-5 py-2.5 text-[13px] border-l-[3px] transition-all ${
                  active
                    ? "border-brand-accent bg-brand-accent/15 text-white font-semibold"
                    : "border-transparent hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {t(n.key)}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 text-[11px] text-[#6B6B63]">
          {client?.slack_channel && (
            <div className="mb-1">{client.slack_channel}</div>
          )}
          <div className="mb-3">hello@vantx.io</div>
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="hover:text-white transition"
            >
              {tc("logout")}
            </button>
            <button
              onClick={switchLocale}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            >
              {locale === "es" ? "EN" : "ES"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
