"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  clearReadNotificationsAction,
  getNotificationsAction,
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

interface NotificationsListProps {
  initialNotifications: Notification[];
  initialTotal: number;
  initialUnreadCount: number;
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

const notificationColors: Record<NotificationType, string> = {
  ISSUE_ASSIGNED: "bg-blue-500/20 border-blue-500/30",
  COMMENT_ADDED: "bg-green-500/20 border-green-500/30",
  DUE_DATE_APPROACHING: "bg-yellow-500/20 border-yellow-500/30",
  DUE_DATE_TODAY: "bg-red-500/20 border-red-500/30",
  TEAM_INVITE: "bg-purple-500/20 border-purple-500/30",
  ROLE_CHANGED: "bg-orange-500/20 border-orange-500/30",
};

export function NotificationsList({
  initialNotifications,
  initialTotal,
  initialUnreadCount,
}: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const hasMore = notifications.length < total;

  async function loadMore() {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await getNotificationsAction(nextPage, 20, false);
      setNotifications((prev) => [...prev, ...result.notifications]);
      setTotal(result.total);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setIsLoadingMore(false);
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

  function handleDelete(notificationId: string) {
    startTransition(async () => {
      await deleteNotificationAction(notificationId);
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  }

  function handleClearRead() {
    startTransition(async () => {
      await clearReadNotificationsAction();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      setTotal(unreadCount);
    });
  }

  function formatTime(date: Date) {
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-xl p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "all"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === "unread"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              Mark all as read
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              onClick={handleClearRead}
              disabled={isPending}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            >
              Clear read
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-neutral-900 border border-neutral-700/50 rounded-xl overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800 flex items-center justify-center text-3xl">
              {filter === "unread" ? "✓" : "📭"}
            </div>
            <h3 className="text-lg font-medium text-white mb-1">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </h3>
            <p className="text-neutral-500">
              {filter === "unread"
                ? "You're all caught up!"
                : "When you get notifications, they'll show up here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-700/50">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative group ${
                  !notification.isRead ? "bg-blue-900/5" : ""
                }`}
              >
                <div className="p-4 flex gap-4">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-xl border ${
                      notificationColors[notification.type]
                    }`}
                  >
                    {notificationIcons[notification.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-neutral-400 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isPending}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isPending}
                          className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Link */}
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
                      >
                        View details
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && filter === "all" && (
          <div className="p-4 border-t border-neutral-700/50">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full" />
                  Loading...
                </span>
              ) : (
                `Load more (${total - notifications.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
