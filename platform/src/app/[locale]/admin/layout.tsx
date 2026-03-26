"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import type { User } from "@/lib/types";
import { NotificationBell } from "@/components/NotificationBell";

const navItems = [
  { key: "overview", segment: "" },
  { key: "clients", segment: "/clients" },
  { key: "tasks", segment: "/tasks" },
  { key: "billing", segment: "/billing" },
  { key: "users", segment: "/users" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");
  const supabase = createClient();
  const adminBase = `/${locale}/admin`;

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
      if (profile) setUser(profile as User);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  return (
    <div className="flex min-h-screen bg-brand-bg">
      {/* Sidebar — per D-04: same dark aesthetic as portal */}
      <aside className="w-60 bg-brand-sidebar text-[#A3A39B] flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-white/10">
          {/* Header: logo + ADMIN badge + role badge — per D-05 */}
          <div className="flex items-center gap-2.5 mb-3">
            <Image
              src="/vantx-logo-white.png"
              alt="Vantx"
              width={120}
              height={32}
              className="h-7 w-auto"
            />
          </div>
          <div className="flex gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-accent/20 text-brand-accent">
              {t("sidebar.admin_badge")}
            </span>
            {user?.role && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70">
                {user.role.toUpperCase()}
              </span>
            )}
          </div>
          {/* NotificationBell — per D-07, completes NOTIF-09 */}
          <div className="flex items-center justify-between mt-2">
            <NotificationBell />
          </div>
        </div>

        {/* Nav — per D-06: Overview, Clients, Tasks, Billing */}
        <nav className="flex-1 py-3">
          {navItems.map((n) => {
            const href = `${adminBase}${n.segment}`;
            const active =
              pathname === href ||
              (n.segment !== "" && pathname.startsWith(href));
            return (
              <button
                key={n.key}
                onClick={() => router.push(href)}
                className={`flex items-center gap-2.5 w-full px-5 py-2.5 text-[13px] border-l-[3px] transition-all ${
                  active
                    ? "border-brand-accent bg-brand-accent/15 text-white font-semibold"
                    : "border-transparent hover:bg-white/5 hover:text-white/80"
                }`}
              >
                {t(`nav.${n.key}`)}
              </button>
            );
          })}
        </nav>

        {/* Footer — per D-08: user name, logout, Back to Portal */}
        <div className="p-4 border-t border-white/10 text-[11px] text-[#6B6B63]">
          {user?.full_name && (
            <div className="text-white/70 text-xs mb-2">{user.full_name}</div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="hover:text-white transition"
            >
              Sign out
            </button>
            <button
              onClick={() => router.push(`/${locale}/portal`)}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition"
            >
              {t("sidebar.back_to_portal")}
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
