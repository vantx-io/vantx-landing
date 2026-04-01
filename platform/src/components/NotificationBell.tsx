"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import type {
  AppNotification as Notification,
  NotificationType,
} from "@/lib/types";
import { Bell, CreditCard, CheckSquare, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const supabase = createClient();

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const currentLocale = useLocale();
  const t = useTranslations("notifications");

  // Effect #1: Init data + Realtime subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Fetch initial notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
      }

      // Subscribe to realtime INSERT events filtered by user_id (per NOTIF-04)
      channel = supabase
        .channel("notifications:" + user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            setPulse(true);
            setTimeout(() => setPulse(false), 2000);
          },
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Effect #2: Click-outside handler
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open]);

  // Effect #3: Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Computed values
  const unreadCount = notifications.filter((n) => !n.read).length;
  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  async function markRead(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any)
      .update({ read: true })
      .eq("id", id);

    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setOpen(false);

    if (target?.action_link) {
      router.push(target.action_link);
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any)
      .update({ read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function getTypeIcon(type: NotificationType) {
    switch (type) {
      case "payment_success":
        return <CreditCard className="w-4 h-4 text-green-400" />;
      case "payment_failed":
        return <CreditCard className="w-4 h-4 text-red-400" />;
      case "task_created":
        return <Plus className="w-4 h-4 text-blue-400" />;
      case "task_updated":
        return <CheckSquare className="w-4 h-4 text-brand-accent" />;
      default:
        return <Bell className="w-4 h-4 text-[#A3A39B]" />;
    }
  }

  function formatTime(dateStr: string) {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: currentLocale === "es" ? es : undefined,
    });
  }

  // If no user resolved yet, render nothing
  if (!userId) return null;

  return (
    <div ref={bellRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg hover:bg-white/10 transition"
        aria-label={t("title")}
      >
        <Bell className="w-5 h-5 text-[#A3A39B]" />
        {unreadCount > 0 && (
          <>
            {/* Ping animation overlay */}
            <span
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-accent text-white text-[10px] font-bold px-1 ${
                pulse ? "animate-ping" : "hidden"
              }`}
            >
              {badgeLabel}
            </span>
            {/* Static badge always visible */}
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-brand-accent text-white text-[10px] font-bold px-1">
              {badgeLabel}
            </span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[400px] bg-brand-sidebar border border-white/10 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white text-sm font-semibold">
              {t("title")}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-brand-accent text-xs hover:underline"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="overflow-y-auto flex-1"
            style={{ maxHeight: "340px" }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[#6B6B63]">
                <Bell className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">{t("empty")}</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 ${
                    !n.read ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs truncate ${
                          !n.read
                            ? "text-white font-semibold"
                            : "text-[#A3A39B]"
                        }`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#6B6B63] flex-shrink-0">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6B63] truncate mt-0.5">
                      {n.body}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
