"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "./auth";

/**
 * Get project statistics for the dashboard
 */
export async function getProjectStats(projectId: string) {
  const session = await getSession();
  if (!session) return null;

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      team: {
        include: {
          members: { where: { userId: session.user.id } },
        },
      },
    },
  });

  if (!project || project.team.members.length === 0) {
    return null;
  }

  // Get issue counts by status
  const issuesByStatus = await prisma.issue.groupBy({
    by: ["status"],
    where: { projectId, deletedAt: null },
    _count: { id: true },
  });

  // Get issue counts by priority
  const issuesByPriority = await prisma.issue.groupBy({
    by: ["priority"],
    where: { projectId, deletedAt: null },
    _count: { id: true },
  });

  // Get recently created issues (max 5)
  const recentIssues = await prisma.issue.findMany({
    where: { projectId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
      assignee: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Get issues due soon (within 7 days, max 5)
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const dueToSoonIssues = await prisma.issue.findMany({
    where: {
      projectId,
      deletedAt: null,
      status: { not: "DONE" },
      dueDate: {
        gte: now,
        lte: sevenDaysFromNow,
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      assignee: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  // Calculate totals
  const totalIssues = issuesByStatus.reduce(
    (sum, item) => sum + item._count.id,
    0
  );
  const doneCount =
    issuesByStatus.find((item) => item.status === "DONE")?._count.id ?? 0;
  const completionRate =
    totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0;

  // Transform to chart-friendly format
  const statusChartData = issuesByStatus.map((item) => ({
    name: formatStatus(item.status),
    value: item._count.id,
    status: item.status,
  }));

  const priorityChartData = issuesByPriority.map((item) => ({
    name: formatPriority(item.priority),
    value: item._count.id,
    priority: item.priority,
  }));

  return {
    totalIssues,
    doneCount,
    completionRate,
    statusChartData,
    priorityChartData,
    recentIssues,
    dueToSoonIssues,
  };
}

/**
 * Get personal dashboard statistics
 */
export async function getPersonalStats() {
  const session = await getSession();
  if (!session) return null;

  const userId = session.user.id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Get assigned issues by status
  const myIssuesByStatus = await prisma.issue.groupBy({
    by: ["status"],
    where: { assigneeId: userId, deletedAt: null },
    _count: { id: true },
  });

  // Get issues due today
  const dueTodayIssues = await prisma.issue.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      status: { not: "DONE" },
      dueDate: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      project: {
        select: { id: true, name: true },
      },
    },
  });

  // Get issues due soon (within 7 days, excluding today)
  const dueSoonIssues = await prisma.issue.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      status: { not: "DONE" },
      dueDate: {
        gte: todayEnd,
        lte: sevenDaysFromNow,
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      projectId: true,
      project: {
        select: { id: true, name: true },
      },
    },
  });

  // Get my recent comments (max 5)
  const recentComments = await prisma.comment.findMany({
    where: { authorId: userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      content: true,
      createdAt: true,
      issue: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    },
  });

  // Calculate totals
  const totalAssignedIssues = myIssuesByStatus.reduce(
    (sum, item) => sum + item._count.id,
    0
  );

  // Transform for chart
  const statusChartData = myIssuesByStatus.map((item) => ({
    name: formatStatus(item.status),
    value: item._count.id,
    status: item.status,
  }));

  return {
    totalAssignedIssues,
    statusChartData,
    dueTodayIssues,
    dueSoonIssues,
    recentComments,
  };
}

/**
 * Get team statistics
 */
export async function getTeamStats(teamId: string, periodDays: number = 7) {
  const session = await getSession();
  if (!session) return null;

  // Verify membership
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
  });

  if (!membership) return null;

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);
  periodStart.setHours(0, 0, 0, 0);

  // Get team projects
  const projects = await prisma.project.findMany({
    where: { teamId, deletedAt: null },
    select: { id: true, name: true },
  });

  const projectIds = projects.map((p) => p.id);

  // Get issue creation trend by day
  const issueCreationTrend = await getIssueTrendByDay(
    projectIds,
    periodStart,
    periodDays,
    "createdAt"
  );

  // Get issue completion trend by day (when status changed to DONE)
  // We'll approximate this by looking at issues that are DONE and updated in the period
  const completionTrend = await getCompletionTrendByDay(
    projectIds,
    periodStart,
    periodDays
  );

  // Get assigned issues per member
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  const memberStats = await Promise.all(
    members.map(async (member) => {
      const assignedCount = await prisma.issue.count({
        where: {
          projectId: { in: projectIds },
          assigneeId: member.user.id,
          deletedAt: null,
        },
      });

      const completedCount = await prisma.issue.count({
        where: {
          projectId: { in: projectIds },
          assigneeId: member.user.id,
          status: "DONE",
          deletedAt: null,
        },
      });

      return {
        userId: member.user.id,
        userName: member.user.name,
        userImage: member.user.image,
        assignedCount,
        completedCount,
      };
    })
  );

  // Get issue status per project
  const projectStats = await Promise.all(
    projects.map(async (project) => {
      const statusCounts = await prisma.issue.groupBy({
        by: ["status"],
        where: { projectId: project.id, deletedAt: null },
        _count: { id: true },
      });

      return {
        projectId: project.id,
        projectName: project.name,
        statusCounts: statusCounts.map((sc) => ({
          status: sc.status,
          count: sc._count.id,
        })),
      };
    })
  );

  return {
    periodDays,
    issueCreationTrend,
    completionTrend,
    memberStats,
    projectStats,
  };
}

// Helper functions
function formatStatus(status: string): string {
  switch (status) {
    case "BACKLOG":
      return "Backlog";
    case "TODO":
      return "To Do";
    case "IN_PROGRESS":
      return "In Progress";
    case "IN_REVIEW":
      return "In Review";
    case "DONE":
      return "Done";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

function formatPriority(priority: string): string {
  switch (priority) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    case "URGENT":
      return "Urgent";
    default:
      return priority;
  }
}

async function getIssueTrendByDay(
  projectIds: string[],
  startDate: Date,
  days: number,
  dateField: "createdAt" | "updatedAt"
) {
  const result: { date: string; count: number }[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await prisma.issue.count({
      where: {
        projectId: { in: projectIds },
        deletedAt: null,
        [dateField]: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    result.push({
      date: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
    });
  }

  return result;
}

async function getCompletionTrendByDay(
  projectIds: string[],
  startDate: Date,
  days: number
) {
  const result: { date: string; count: number }[] = [];

  for (let i = 0; i < days; i++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Count issues that are DONE and were updated on this day
    // This is an approximation - ideally we'd track status change history
    const count = await prisma.issue.count({
      where: {
        projectId: { in: projectIds },
        deletedAt: null,
        status: "DONE",
        updatedAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    result.push({
      date: dayStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      count,
    });
  }

  return result;
}
