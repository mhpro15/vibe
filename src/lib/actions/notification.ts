"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { NotificationType } from "@/generated/prisma/client";

// ============================================
// NOTIFICATION ACTIONS (FR-090, FR-091)
// ============================================

export type NotificationActionResult = {
  success: boolean;
  error?: string;
  data?: {
    notificationId?: string;
    unreadCount?: number;
  };
};

// ============================================
// QUERY FUNCTIONS
// ============================================

/**
 * Get notifications for the current user with pagination
 */
export async function getNotificationsAction(
  page: number = 1,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<{
  notifications: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  }>;
  total: number;
  unreadCount: number;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { notifications: [], total: 0, unreadCount: 0 };
  }

  const skip = (page - 1) * limit;

  const whereClause = {
    userId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: whereClause }),
    prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ]);

  return { notifications, total, unreadCount };
}

/**
 * Get unread notification count only (for header badge)
 */
export async function getUnreadCountAction(): Promise<number> {
  const session = await getSession();
  if (!session?.user?.id) {
    return 0;
  }

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

// ============================================
// MUTATION FUNCTIONS
// ============================================

/**
 * Mark a single notification as read
 */
export async function markAsReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  // Verify notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    return { success: false, error: "Notification not found" };
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  revalidatePath("/notifications");

  return { success: true, data: { notificationId } };
}

/**
 * Mark all notifications as read
 */
export async function markAllAsReadAction(): Promise<NotificationActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });

  revalidatePath("/notifications");

  return { success: true };
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  // Verify notification belongs to user
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    return { success: false, error: "Notification not found" };
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  revalidatePath("/notifications");

  return { success: true };
}

/**
 * Delete all read notifications
 */
export async function clearReadNotificationsAction(): Promise<NotificationActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  await prisma.notification.deleteMany({
    where: { userId: session.user.id, isRead: true },
  });

  revalidatePath("/notifications");

  return { success: true };
}

// ============================================
// NOTIFICATION CREATION HELPERS
// (Called from other actions when events occur)
// ============================================

/**
 * Create a notification for a user
 * This is called internally from other actions, not directly by clients
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
      },
    });
  } catch (error) {
    // Log but don't throw - notification failures shouldn't break main actions
    console.error("Failed to create notification:", error);
  }
}

/**
 * Notify user when they're assigned to an issue
 */
export async function notifyIssueAssigned(
  assigneeId: string,
  issueId: string,
  issueTitle: string,
  projectId: string,
  assignerName: string
): Promise<void> {
  await createNotification(
    assigneeId,
    "ISSUE_ASSIGNED",
    "Issue Assigned to You",
    `${assignerName} assigned you to: ${issueTitle}`,
    `/projects/${projectId}/issues/${issueId}`
  );
}

/**
 * Notify issue creator/assignee when a comment is added
 */
export async function notifyCommentAdded(
  userIds: string[],
  excludeUserId: string, // Don't notify the commenter
  issueId: string,
  issueTitle: string,
  projectId: string,
  commenterName: string
): Promise<void> {
  const uniqueUserIds = [...new Set(userIds)].filter(
    (id) => id !== excludeUserId
  );

  await Promise.all(
    uniqueUserIds.map((userId) =>
      createNotification(
        userId,
        "COMMENT_ADDED",
        "New Comment",
        `${commenterName} commented on: ${issueTitle}`,
        `/projects/${projectId}/issues/${issueId}`
      )
    )
  );
}

/**
 * Notify user when their team role changes
 */
export async function notifyRoleChanged(
  userId: string,
  teamName: string,
  newRole: string,
  teamId: string
): Promise<void> {
  await createNotification(
    userId,
    "ROLE_CHANGED",
    "Role Updated",
    `Your role in ${teamName} has been changed to ${newRole}`,
    `/teams/${teamId}`
  );
}

/**
 * Notify user of team invitation
 */
export async function notifyTeamInvite(
  userId: string,
  teamName: string,
  inviterName: string,
  teamId: string
): Promise<void> {
  await createNotification(
    userId,
    "TEAM_INVITE",
    "Team Invitation",
    `${inviterName} invited you to join ${teamName}`,
    `/teams/${teamId}`
  );
}

/**
 * Notify about approaching due date (for scheduled jobs/cron)
 */
export async function notifyDueDateApproaching(
  userId: string,
  issueId: string,
  issueTitle: string,
  projectId: string,
  daysRemaining: number
): Promise<void> {
  await createNotification(
    userId,
    "DUE_DATE_APPROACHING",
    "Due Date Approaching",
    `"${issueTitle}" is due in ${daysRemaining} day${
      daysRemaining > 1 ? "s" : ""
    }`,
    `/projects/${projectId}/issues/${issueId}`
  );
}

/**
 * Notify about due date today
 */
export async function notifyDueDateToday(
  userId: string,
  issueId: string,
  issueTitle: string,
  projectId: string
): Promise<void> {
  await createNotification(
    userId,
    "DUE_DATE_TODAY",
    "Due Today",
    `"${issueTitle}" is due today!`,
    `/projects/${projectId}/issues/${issueId}`
  );
}
