import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { getMyInvites } from "@/lib/actions/team";
import { PendingInvitations } from "@/components/team";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardIssuesList } from "@/components/dashboard/DashboardIssuesList";
import { DashboardRecentActivity } from "@/components/dashboard/DashboardRecentActivity";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Fetch user's teams and their projects/issues
  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          _count: {
            select: {
              members: true,
              projects: { where: { deletedAt: null } },
            },
          },
          projects: {
            where: { deletedAt: null },
            take: 3,
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const teams = memberships.filter((m) => m.team.deletedAt === null);

  // Get assigned issues grouped by status
  const assignedIssues = await prisma.issue.findMany({
    where: {
      assigneeId: session.user.id,
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const inProgressIssues = assignedIssues.filter(
    (i) => i.status === "IN_PROGRESS" || i.status === "IN_REVIEW"
  );
  const upNextIssues = assignedIssues.filter(
    (i) => i.status === "TODO" || i.status === "BACKLOG"
  );
  const doneThisWeek = assignedIssues.filter((i) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return i.status === "DONE" && new Date(i.updatedAt) >= weekAgo;
  });

  // Get issues due today
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const dueTodayIssues = await prisma.issue.findMany({
    where: {
      assigneeId: session.user.id,
      deletedAt: null,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Get issues due soon (within 7 days, excluding today)
  const dueSoonIssues = await prisma.issue.findMany({
    where: {
      assigneeId: session.user.id,
      deletedAt: null,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: {
        gte: todayEnd,
        lte: sevenDaysFromNow,
      },
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // Get my recent comments (max 5)
  const recentComments = await prisma.comment.findMany({
    where: { authorId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      issue: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    },
  });

  // Get recent activity
  const recentActivity = await prisma.issue.findMany({
    where: {
      OR: [{ assigneeId: session.user.id }, { creatorId: session.user.id }],
      deletedAt: null,
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      assignee: {
        select: { name: true, image: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  // Get pending team invitations
  const pendingInvitations = await getMyInvites();

  // Get recent projects the user has access to
  const recentProjects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      team: {
        deletedAt: null,
        members: {
          some: { userId: session.user.id },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      team: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
    },
  });

  return (
    <div className="w-full">
      <DashboardHeader userName={session.user.name || "User"} />

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-4 md:mb-6">
          <PendingInvitations invitations={pendingInvitations} />
        </div>
      )}

      <DashboardStats
        inProgressCount={inProgressIssues.length}
        backlogCount={upNextIssues.length}
        doneThisWeekCount={doneThisWeek.length}
        dueTodayCount={dueTodayIssues.length}
      />

      {/* Mobile: Priority Content First, Desktop: 2-column grid */}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-4 lg:gap-6">
        {/* Main Content - Issues */}
        <div className="lg:col-span-2 space-y-3 md:space-y-4 lg:space-y-6">
          {dueTodayIssues.length > 0 && (
            <DashboardIssuesList
              title="Due Today"
              issues={dueTodayIssues.slice(0, 5)}
              type="due-today"
              showMoreCount={dueTodayIssues.length > 5 ? dueTodayIssues.length - 5 : 0}
            />
          )}

          <DashboardIssuesList
            title="Currently Working On"
            issues={inProgressIssues.slice(0, 4)}
            type="in-progress"
            emptyMessage="No issues in progress"
            emptySubMessage="Pick something from your backlog to get started"
            showMoreCount={
              inProgressIssues.length > 4 ? inProgressIssues.length - 4 : 0
            }
          />

          {dueSoonIssues.length > 0 && (
            <DashboardIssuesList
              title="Due This Week"
              issues={dueSoonIssues.slice(0, 5)}
              type="due-soon"
              showMoreCount={dueSoonIssues.length > 5 ? dueSoonIssues.length - 5 : 0}
            />
          )}

          <DashboardIssuesList
            title="Up Next"
            issues={upNextIssues.slice(0, 5)}
            type="up-next"
            emptyMessage="Backlog is empty"
            emptySubMessage="Great job! You're all caught up."
            showMoreCount={
              upNextIssues.length > 5 ? upNextIssues.length - 5 : 0
            }
          />
        </div>

        {/* Sidebar Content */}
        <div className="space-y-4 md:space-y-6">
          <DashboardRecentActivity
            recentActivity={recentActivity}
            recentComments={recentComments}
          />

          <DashboardSidebar teams={teams} recentProjects={recentProjects} />
        </div>
      </div>
    </div>
  );
}
