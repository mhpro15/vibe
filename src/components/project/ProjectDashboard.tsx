"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPieChart, PriorityBarChart } from "@/components/charts";
import { getProjectStats } from "@/lib/actions/stats";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Signal,
  SignalMedium,
  SignalLow,
  Loader2,
} from "lucide-react";

interface ProjectDashboardProps {
  projectId: string;
}

type ProjectStats = Awaited<ReturnType<typeof getProjectStats>>;

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const [stats, setStats] = useState<ProjectStats>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const data = await getProjectStats(projectId);
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-neutral-500">
        Failed to load dashboard data
      </div>
    );
  }

  const getPriorityIcon = (priority: string) => {
    const baseClass = "w-4 h-4";
    switch (priority) {
      case "URGENT":
        return <AlertTriangle className={`${baseClass} text-red-400`} />;
      case "HIGH":
        return <Signal className={`${baseClass} text-orange-400`} />;
      case "MEDIUM":
        return <SignalMedium className={`${baseClass} text-yellow-400`} />;
      default:
        return <SignalLow className={`${baseClass} text-neutral-500`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-violet-500";
      case "DONE":
        return "bg-emerald-500";
      case "IN_REVIEW":
        return "bg-amber-500";
      case "TODO":
        return "bg-blue-500";
      default:
        return "bg-neutral-500";
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const due = new Date(date);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.totalIssues}
              </div>
              <div className="text-xs text-neutral-500">Total Issues</div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.doneCount}
              </div>
              <div className="text-xs text-neutral-500">Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.completionRate}%
              </div>
              <div className="text-xs text-neutral-500">Completion Rate</div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {stats.dueToSoonIssues.length}
              </div>
              <div className="text-xs text-neutral-500">Due This Week</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
            Issues by Status
          </h3>
          <StatusPieChart data={stats.statusChartData} />
        </div>

        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
            Issues by Priority
          </h3>
          <PriorityBarChart data={stats.priorityChartData} />
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Created */}
        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
            Recently Created
          </h3>
          {stats.recentIssues.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-6">
              No recent issues
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/projects/${projectId}/issues/${issue.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                      issue.status
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">
                      {issue.title}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {formatDate(issue.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(issue.priority)}
                    {issue.assignee && (
                      <Avatar
                        src={issue.assignee.image}
                        name={issue.assignee.name}
                        size="xs"
                      />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Due Soon */}
        <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
            Due This Week
          </h3>
          {stats.dueToSoonIssues.length === 0 ? (
            <div className="text-center text-neutral-500 text-sm py-6">
              No issues due this week
            </div>
          ) : (
            <div className="space-y-2">
              {stats.dueToSoonIssues.map((issue) => {
                const daysUntil = getDaysUntil(issue.dueDate!);
                return (
                  <Link
                    key={issue.id}
                    href={`/projects/${projectId}/issues/${issue.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${getStatusColor(
                        issue.status
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {issue.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Due {formatDate(issue.dueDate!)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          daysUntil <= 1
                            ? "bg-red-500/20 text-red-400"
                            : daysUntil <= 3
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-neutral-700 text-neutral-300"
                        }`}
                      >
                        {daysUntil === 0
                          ? "Today"
                          : daysUntil === 1
                          ? "Tomorrow"
                          : `${daysUntil}d`}
                      </span>
                      {issue.assignee && (
                        <Avatar
                          src={issue.assignee.image}
                          name={issue.assignee.name}
                          size="xs"
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
