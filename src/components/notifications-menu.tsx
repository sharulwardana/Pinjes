"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationResponse {
  items: NotificationItem[];
  unreadCount: number;
}

async function fetchNotifications(): Promise<NotificationResponse> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Gagal mengambil notifikasi");
  const json = await res.json();
  return json.data;
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60_000,
  });

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData<NotificationResponse>(["notifications"], (old) => {
        if (!old) return old;
        return {
          unreadCount: 0,
          items: old.items.map((i) => ({ ...i, readAt: new Date().toISOString() })),
        };
      });
    },
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      markReadMutation.mutate();
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        className="relative grid size-10 place-items-center rounded-full text-ink/75 transition duration-200 hover:bg-line/40 hover:text-ink active:scale-95"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-signal text-[0.625rem] font-bold text-ink shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-surface p-3 shadow-xl backdrop-blur-md transition sm:w-96">
          <div className="mb-2 flex items-center justify-between border-b border-line px-2 pb-2">
            <span className="text-sm font-bold text-ink">Notifikasi</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markReadMutation.mutate()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Tandai dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
                <Inbox className="size-7 opacity-40" />
                <p className="mt-2 text-xs">Belum ada notifikasi.</p>
              </div>
            ) : (
              items.map((item) => {
                const isUnread = !item.readAt;
                const content = (
                  <div
                    className={cn(
                      "block rounded-xl p-2.5 text-left transition",
                      isUnread ? "bg-brand-soft/50 hover:bg-brand-soft" : "hover:bg-line/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-xs font-semibold", isUnread ? "text-brand" : "text-ink")}>
                        {item.title}
                      </p>
                      <span className="shrink-0 text-[0.625rem] text-muted">
                        {formatRelative(new Date(item.createdAt))}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.body}</p>
                  </div>
                );

                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
