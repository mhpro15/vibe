import { Suspense } from "react";
import { getNotificationsAction } from "@/lib/actions/notification";
import { NotificationsList } from "./NotificationsList";

export const metadata = {
  title: "Notifications | Vibe",
};

export default async function NotificationsPage() {
  const { notifications, total, unreadCount } = await getNotificationsAction(
    1,
    50,
    false
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-neutral-400 mt-1">
            {unreadCount > 0 ? (
              <>
                You have{" "}
                <span className="text-blue-400 font-medium">
                  {unreadCount} unread
                </span>{" "}
                notification{unreadCount !== 1 ? "s" : ""}
              </>
            ) : (
              "All caught up!"
            )}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <Suspense fallback={<NotificationsLoading />}>
        <NotificationsList
          initialNotifications={notifications}
          initialTotal={total}
          initialUnreadCount={unreadCount}
        />
      </Suspense>
    </div>
  );
}

function NotificationsLoading() {
  return (
    <div className="bg-neutral-900 border border-neutral-700/50 rounded-xl">
      <div className="animate-pulse p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-800 rounded w-1/4" />
              <div className="h-3 bg-neutral-800 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
