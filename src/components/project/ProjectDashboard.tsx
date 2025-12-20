"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatusPieChart, CompletionRingChart } from "@/components/charts";
import { getProjectStats } from "@/lib/actions/stats";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Calendar,
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-neutral-500 text-sm">
        Unable to load dashboard
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BACKLOG":
        return "bg-neutral-500";
      case "TODO":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-violet-500";
      case "IN_REVIEW":
        return "bg-amber-500";
      case "DONE":
        return "bg-emerald-500";
      case "CANCELLED":
        return "bg-neutral-600";
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

  const openIssues = stats.totalIssues - stats.doneCount;

  return (
    <div className="space-y-3">
      {/* Stats & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Combined Stats Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Overview
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {openIssues}
              </div>
              <div className="text-[10px] text-neutral-500">Open</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {stats.doneCount}
              </div>
              <div className="text-[10px] text-neutral-500">Done</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {stats.inProgressCount}
              </div>
              <div className="text-[10px] text-neutral-500">In Progress</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-white tabular-nums">
                {stats.completionRate}%
              </div>
              <div className="text-[10px] text-neutral-500">Complete</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 pt-3 border-t border-neutral-800">
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            By Status
          </div>
          <StatusPieChart data={stats.statusChartData} />
        </div>

        {/* Progress Ring */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Progress
          </div>
          <CompletionRingChart
            completionRate={stats.completionRate}
            totalIssues={stats.totalIssues}
            doneCount={stats.doneCount}
            inProgressCount={stats.inProgressCount}
          />
        </div>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Issues */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="px-3 py-2 border-b border-neutral-800">
            <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
              Recent Issues
            </div>
          </div>
          {stats.recentIssues.length === 0 ? (
            <div className="p-6 text-center text-neutral-600 text-xs">
              No issues yet
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/50">
              {stats.recentIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/projects/${projectId}/issues/${issue.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-800/50 transition-colors group"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                      issue.status
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-neutral-200 truncate group-hover:text-white transition-colors">
                      {issue.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-neutral-600">
                      {formatDate(issue.createdAt)}
                    </span>
                    {issue.assignee && (
                      <Avatar
                        src={issue.assignee.image}
                        name={issue.assignee.name}
                        size="xs"
                      />
                    )}
                    <ArrowUpRight className="w-3 h-3 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Due Soon */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
            <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
              Due Soon
            </div>
            {stats.dueToSoonIssues.length > 0 && (
              <span className="text-[10px] text-neutral-600">
                {stats.dueToSoonIssues.length} issue
                {stats.dueToSoonIssues.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {stats.dueToSoonIssues.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-4 h-4 text-neutral-700 mx-auto mb-2" />
              <div className="text-neutral-600 text-xs">All caught up</div>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800/50">
              {stats.dueToSoonIssues.map((issue) => {
                const daysUntil = getDaysUntil(issue.dueDate!);
                const isOverdue = daysUntil < 0;
                const isToday = daysUntil === 0;
                const isTomorrow = daysUntil === 1;

                return (
                  <Link
                    key={issue.id}
                    href={`/projects/${projectId}/issues/${issue.id}`}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                        issue.status
                      )}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-neutral-200 truncate group-hover:text-white transition-colors">
                        {issue.title}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          isOverdue || isToday
                            ? "text-red-400"
                            : isTomorrow
                            ? "text-amber-400"
                            : "text-neutral-500"
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>
                          {isOverdue
                            ? "Overdue"
                            : isToday
                            ? "Today"
                            : isTomorrow
                            ? "Tomorrow"
                            : formatDate(issue.dueDate!)}
                        </span>
                      </div>
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
