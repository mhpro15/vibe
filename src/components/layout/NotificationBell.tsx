"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
} from "@/lib/actions/notification";
import { NotificationType } from "@/generated/prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

// Icons for different notification types
const notificationIcons: Record<NotificationType, string> = {
  ISSUE_ASSIGNED: "📋",
  COMMENT_ADDED: "💬",
  DUE_DATE_APPROACHING: "⏰",
  DUE_DATE_TODAY: "🔔",
  TEAM_INVITE: "👥",
  ROLE_CHANGED: "🔑",
};

export function NotificationBell() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch initial unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Refetch notifications on page/route change to mimic live updates
  useEffect(() => {
    fetchUnreadCount();
  }, [pathname]);

  async function fetchNotifications() {
    setIsLoading(true);
    try {
      const result = await getNotificationsAction(1, 10, false);
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUnreadCount() {
    try {
      const result = await getNotificationsAction(1, 1, false);
      setUnreadCount(result.unreadCount);
    } catch {
      // Silently fail
    }
  }

  function handleMarkAsRead(notificationId: string) {
    startTransition(async () => {
      await markAsReadAction(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  }

  function handleMarkAllAsRead() {
    startTransition(async () => {
      await markAllAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  }

  function formatTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-neutral-800 transition-colors"
        aria-label="Notifications"
      >
        <svg
          className="w-5 h-5 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700/50 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-700/50 flex items-center justify-between">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-neutral-500">
                <div className="animate-spin w-6 h-6 border-2 border-neutral-500 border-t-transparent rounded-full mx-auto mb-2" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-neutral-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative ${
                    !notification.isRead ? "bg-blue-900/10" : ""
                  }`}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => {
                        if (!notification.isRead) {
                          handleMarkAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className="block px-4 py-3 hover:bg-neutral-800/50 transition-colors"
                    >
                      <NotificationContent
                        notification={notification}
                        formatTime={formatTime}
                      />
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <NotificationContent
                        notification={notification}
                        formatTime={formatTime}
                      />
                    </div>
                  )}
                  {!notification.isRead && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-neutral-700/50">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-blue-400 hover:text-blue-300 py-1"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({
  notification,
  formatTime,
}: {
  notification: Notification;
  formatTime: (date: Date) => string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-xl shrink-0">
        {notificationIcons[notification.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {notification.title}
        </p>
        <p className="text-sm text-neutral-400 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}
