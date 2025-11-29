import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import Link from "next/link";

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
    switch (priority) {
      case "URGENT":
        return (
          <svg
            className="w-3.5 h-3.5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "HIGH":
        return (
          <svg
            className="w-3.5 h-3.5 text-orange-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        );
      case "MEDIUM":
        return (
          <svg
            className="w-3.5 h-3.5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-3.5 h-3.5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
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
    <div className="max-w-6xl">
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

      {/* Quick Stats Row */}
      <div className="flex items-center gap-4 mb-8 text-sm">
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
              <Link
                href="/issues?status=IN_PROGRESS"
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View all →
              </Link>
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

          {/* Up Next */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                Up Next
              </h2>
              <Link
                href="/issues?status=BACKLOG"
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>
            {backlogIssues.length === 0 ? (
              <div className="border border-dashed border-neutral-700 rounded-lg p-6 text-center">
                <p className="text-neutral-400 text-sm">Your backlog is empty</p>
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
                        {membership.team.projects.map((project: { id: string; name: string }) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-0.5"
                          >
                            <span className="text-neutral-600">→</span>
                            <span className="truncate">{project.name}</span>
                          </Link>
                        ))}
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
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
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
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                Browse Projects
              </Link>
              <Link
                href="/teams"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
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
                    strokeWidth={1.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                Manage Teams
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
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
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </Link>
            </div>
          </section>

          {/* Keyboard Shortcuts Hint */}
          <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
            <p className="text-xs text-neutral-400 mb-3 font-medium">Keyboard shortcuts</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>New issue</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">
                  C
                </kbd>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Search</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">
                  /
                </kbd>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Go to projects</span>
                <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">
                  G P
                </kbd>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
