"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  outfit_ready: "OUTFIT",
  trend_alert: "TREND",
  system: "SYSTEM",
  welcome: "WELCOME",
};

export function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-surface-container-lowest shadow-ambient-lg z-50 max-h-96 overflow-y-auto"
      role="region"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
        <span className="label-text text-on-surface-variant text-label-md tracking-widest">
          NOTIFICATIONS
        </span>
        {notifications.some((n) => !n.readAt) && (
          <button
            onClick={onMarkAllRead}
            className="text-body-md text-primary hover:underline font-sans"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-body-md text-on-surface-variant">No notifications yet</p>
        </div>
      ) : (
        <div>
          {notifications.slice(0, 20).map((notif) => {
            const content = (
              <div
                key={notif.id}
                className={`px-4 py-3 border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors cursor-pointer ${
                  !notif.readAt ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!notif.readAt) onMarkAsRead(notif.id);
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-label-md text-on-surface-variant tracking-widest font-sans">
                    {TYPE_LABELS[notif.type] ?? notif.type.toUpperCase()}
                  </span>
                  <span className="text-label-md text-on-surface-variant/50">
                    {formatTime(notif.createdAt)}
                  </span>
                  {!notif.readAt && (
                    <span className="w-2 h-2 bg-primary ml-auto" aria-label="Unread" />
                  )}
                </div>
                <p className="text-body-md text-on-surface font-sans font-semibold">{notif.title}</p>
                <p className="text-body-md text-on-surface-variant line-clamp-2">{notif.body}</p>
              </div>
            );

            if (notif.linkUrl) {
              return (
                <Link key={notif.id} href={notif.linkUrl} onClick={onClose}>
                  {content}
                </Link>
              );
            }
            return content;
          })}
        </div>
      )}
    </div>
  );
}
