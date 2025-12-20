"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import {
  StatusPieChart,
  PriorityBarChart,
  TrendLineChart,
  MemberBarChart,
} from "@/components/charts";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

interface DashboardIssue {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  dueDate?: Date | null;
  assignee?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

interface ProjectDashboardProps {
  projectId: string;
  stats: {
    totalIssues: number;
    doneCount: number;
    inProgressCount: number;
    completionRate: number;
    recentIssues: DashboardIssue[];
    dueToSoonIssues: DashboardIssue[];
    issueCreationTrend: any[];
    completionTrend: any[];
    priorityChartData: any[];
    statusChartData: any[];
    memberStats: any[];
    team?: {
      members: Array<{
        id: string;
        name: string;
        image: string | null;
      }>;
    };
  };
}

export function ProjectDashboard({ projectId, stats }: ProjectDashboardProps) {
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
      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Open Issues */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
            <AlertCircle className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tabular-nums leading-none mb-1">{openIssues}</div>
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider leading-none">Open</div>
          </div>
        </div>

        {/* Active Issues */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tabular-nums leading-none mb-1">{stats.inProgressCount}</div>
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider leading-none">Active</div>
          </div>
        </div>

        {/* Done Issues */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tabular-nums leading-none mb-1">{stats.doneCount}</div>
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider leading-none">Done</div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-lg font-bold text-white tabular-nums leading-none mb-1">{stats.completionRate}%</div>
            <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider leading-none">Progress</div>
          </div>
        </div>
      </div>

      {/* Second Row: Trends & Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Activity Trend */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Activity Trend (Last 7 Days)
          </div>
          <TrendLineChart
            creationData={stats.issueCreationTrend}
            completionData={stats.completionTrend}
          />
        </div>

        {/* Priority Distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            By Priority
          </div>
          <PriorityBarChart data={stats.priorityChartData} />
        </div>
      </div>

      {/* Middle Row: Member Performance & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Member Performance */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            Member Performance
          </div>
          <MemberBarChart data={stats.memberStats} />
        </div>

        {/* Status Distribution */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide mb-3">
            By Status
          </div>
          <StatusPieChart data={stats.statusChartData} />
        </div>
      </div>

      {/* Activity Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg">
          <div className="px-3 py-2 border-b border-neutral-800">
            <div className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">
              Team Members
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-wrap gap-2">
              {stats.team?.members.map((member: any) => (
                <div key={member.id} className="flex items-center gap-2 bg-neutral-800/50 rounded-full pl-1 pr-3 py-1 border border-neutral-700/50">
                  <Avatar src={member.image} name={member.name} size="xs" />
                  <span className="text-[10px] text-neutral-300 font-medium">{member.name}</span>
                </div>
              ))}
            </div>
            {(!stats.team?.members || stats.team.members.length === 0) && (
              <div className="text-center py-6 text-neutral-600 text-xs">
                No members found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
