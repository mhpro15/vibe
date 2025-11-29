import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { getMyInvites } from "@/lib/actions/team";
import { PendingInvitations } from "@/components/team";
import Link from "next/link";
import {
  LayoutGrid,
  Users,
  Settings,
  Signal,
  SignalMedium,
  SignalLow,
  AlertTriangle,
  Clock,
  MessageSquare,
  CalendarClock,
} from "lucide-react";

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
    (i) => i.status === "IN_PROGRESS"
  );
  const backlogIssues = assignedIssues.filter((i) => i.status === "BACKLOG");
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
      status: { not: "DONE" },
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
      status: { not: "DONE" },
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
    take: 5,
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

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  };

  const getPriorityIcon = (priority: string) => {
    const baseClass = "w-4 h-4 transition-all duration-300";
    switch (priority) {
      case "URGENT":
        return (
          <AlertTriangle
            className={`${baseClass} text-red-400 group-hover:text-red-300 group-hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]`}
            strokeWidth={2}
          />
        );
      case "HIGH":
        return (
          <Signal
            className={`${baseClass} text-orange-400 group-hover:text-orange-300 group-hover:drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]`}
            strokeWidth={2}
          />
        );
      case "MEDIUM":
        return (
          <SignalMedium
            className={`${baseClass} text-yellow-400 group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]`}
            strokeWidth={2}
          />
        );
      default:
        return (
          <SignalLow
            className={`${baseClass} text-neutral-500 group-hover:text-neutral-400`}
            strokeWidth={2}
          />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-violet-500";
      case "DONE":
        return "bg-emerald-500";
      default:
        return "bg-neutral-500";
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-medium text-white mb-1">
          Good{" "}
          {new Date().getHours() < 12
            ? "morning"
            : new Date().getHours() < 18
            ? "afternoon"
            : "evening"}
          , {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-neutral-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mb-6">
          <PendingInvitations invitations={pendingInvitations} />
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="flex flex-wrap items-center gap-4 mb-8 text-sm">
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-violet-500"></div>
          <span className="text-neutral-400">In Progress</span>
          <span className="text-white font-medium">
            {inProgressIssues.length}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
          <span className="text-neutral-400">Backlog</span>
          <span className="text-white font-medium">{backlogIssues.length}</span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-4 py-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-400">Done this week</span>
          <span className="text-white font-medium">{doneThisWeek.length}</span>
        </div>
        {dueTodayIssues.length > 0 && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-4 py-2.5">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">
              {dueTodayIssues.length} due today
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Issues */}
        <div className="lg:col-span-2 space-y-6">
          {/* Currently Working On */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                Currently Working On
              </h2>
              {inProgressIssues.length > 4 && (
                <span className="text-xs text-neutral-500">
                  +{inProgressIssues.length - 4} more
                </span>
              )}
            </div>
            {inProgressIssues.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                <p className="text-neutral-400 text-sm">
                  No issues in progress
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Pick something from your backlog to get started
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {inProgressIssues.slice(0, 4).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-transparent hover:border-neutral-700/50 transition-all group"
                  >
                    <div
                      className={`w-1 h-8 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white truncate">
                          {issue.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {issue.project.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {getPriorityIcon(issue.priority)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Due Today - Only show if there are issues */}
          {dueTodayIssues.length > 0 && (
            <section className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-medium text-red-400 uppercase tracking-wider">
                  Due Today
                </h2>
              </div>
              <div className="space-y-1">
                {dueTodayIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-transparent hover:border-red-700/30 transition-all group"
                  >
                    <div
                      className={`w-1 h-8 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white truncate">
                          {issue.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {issue.project.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(issue.priority)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Due This Week - Only show if there are issues */}
          {dueSoonIssues.length > 0 && (
            <section className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarClock className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider">
                  Due This Week
                </h2>
              </div>
              <div className="space-y-1">
                {dueSoonIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-transparent hover:border-amber-700/30 transition-all group"
                  >
                    <div
                      className={`w-1 h-8 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white truncate">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                        <span>{issue.project.name}</span>
                        {issue.dueDate && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">
                              Due{" "}
                              {new Date(issue.dueDate).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(issue.priority)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Up Next */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                Up Next
              </h2>
              {backlogIssues.length > 5 && (
                <span className="text-xs text-neutral-500">
                  +{backlogIssues.length - 5} more
                </span>
              )}
            </div>
            {backlogIssues.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                <p className="text-neutral-400 text-sm">
                  Your backlog is empty
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {backlogIssues.slice(0, 5).map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-transparent hover:border-neutral-700/50 transition-all group"
                  >
                    <div
                      className={`w-1 h-8 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white truncate">
                          {issue.title}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {issue.project.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(issue.priority)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
              Recent Activity
            </h2>
            {recentActivity.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                <p className="text-neutral-400 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/projects/${issue.projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    ></div>
                    <span className="text-sm text-neutral-300 truncate flex-1">
                      {issue.title}
                    </span>
                    <span className="text-xs text-neutral-600">
                      {getTimeAgo(issue.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* My Recent Comments */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                My Recent Comments
              </h2>
            </div>
            {recentComments.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                <p className="text-neutral-400 text-sm">No comments yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentComments.map((comment) => (
                  <Link
                    key={comment.id}
                    href={`/projects/${comment.issue.projectId}/issues/${comment.issue.id}`}
                    className="block p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                  >
                    <p className="text-sm text-neutral-300 line-clamp-2 mb-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <span className="truncate max-w-[150px]">
                        on {comment.issue.title}
                      </span>
                      <span>•</span>
                      <span>{getTimeAgo(comment.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Teams & Projects */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                Your Teams
              </h2>
              <Link
                href="/teams"
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>
            {teams.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center">
                <p className="text-neutral-400 text-sm mb-2">No teams yet</p>
                <Link
                  href="/teams"
                  className="text-xs text-white hover:underline"
                >
                  Create a team →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {teams.slice(0, 4).map((membership) => (
                  <div
                    key={membership.team.id}
                    className="bg-neutral-800/70 border border-neutral-700/50 rounded-lg p-3"
                  >
                    <Link
                      href={`/teams/${membership.team.id}`}
                      className="flex items-center gap-2 mb-2 group"
                    >
                      <div className="w-6 h-6 rounded bg-linear-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-xs text-white font-medium">
                        {membership.team.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-white group-hover:underline truncate">
                        {membership.team.name}
                      </span>
                      <span className="text-xs text-neutral-600 ml-auto">
                        {membership.role.toLowerCase()}
                      </span>
                    </Link>
                    {membership.team.projects.length > 0 && (
                      <div className="pl-8 space-y-1">
                        {membership.team.projects.map(
                          (project: { id: string; name: string }) => (
                            <Link
                              key={project.id}
                              href={`/projects/${project.id}`}
                              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-0.5"
                            >
                              <span className="text-neutral-600">→</span>
                              <span className="truncate">{project.name}</span>
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Actions */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <h2 className="text-sm font-medium text-white uppercase tracking-wider mb-3">
              Quick Actions
            </h2>
            <div className="space-y-1">
              <Link
                href="/projects"
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-300"
              >
                <LayoutGrid
                  className="w-4 h-4 transition-all duration-300 group-hover:text-violet-400 group-hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)] group-hover:rotate-12"
                  strokeWidth={1.5}
                />
                Browse Projects
              </Link>
              <Link
                href="/teams"
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-300"
              >
                <Users
                  className="w-4 h-4 transition-all duration-300 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] group-hover:-rotate-6"
                  strokeWidth={1.5}
                />
                Manage Teams
              </Link>
              <Link
                href="/profile"
                className="group flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-300"
              >
                <Settings
                  className="w-4 h-4 transition-all duration-300 group-hover:text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] group-hover:rotate-90"
                  strokeWidth={1.5}
                />
                Settings
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
