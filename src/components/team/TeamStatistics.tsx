"use client";

import { useEffect, useState } from "react";
import { TrendLineChart, MemberStatsList } from "@/components/charts";
import { getTeamStats } from "@/lib/actions/stats";
import { Loader2, BarChart3 } from "lucide-react";

interface TeamStatsProps {
  teamId: string;
}

type TeamStats = Awaited<ReturnType<typeof getTeamStats>>;

export function TeamStatistics({ teamId }: TeamStatsProps) {
  const [stats, setStats] = useState<TeamStats>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const data = await getTeamStats(teamId, period);
        setStats(data);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [teamId, period]);

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
        Failed to load team statistics
      </div>
    );
  }

  // Calculate status colors for project bars
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

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          Team Statistics
        </h2>
        <div className="flex gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days as 7 | 30 | 90)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === days
                  ? "bg-violet-600 text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {days === 7 ? "7 days" : days === 30 ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Issue Trends Chart */}
      <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
          Issue Trends (Last {period} Days)
        </h3>
        <TrendLineChart
          creationData={stats.issueCreationTrend}
          completionData={stats.completionTrend}
        />
      </div>

      {/* Member Stats */}
      <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
          Member Activity
        </h3>
        <MemberStatsList data={stats.memberStats} />
      </div>

      {/* Project Status Overview */}
      <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
          Issue Status by Project
        </h3>
        {stats.projectStats.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm py-6">
            No projects found
          </div>
        ) : (
          <div className="space-y-4">
            {stats.projectStats.map((project) => {
              const total = project.statusCounts.reduce(
                (sum, sc) => sum + sc.count,
                0
              );
              if (total === 0) return null;

              return (
                <div key={project.projectId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">
                      {project.projectName}
                    </span>
                    <span className="text-neutral-500">{total} issues</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-neutral-800">
                    {project.statusCounts.map((sc, index) => {
                      const width = (sc.count / total) * 100;
                      if (width === 0) return null;
                      return (
                        <div
                          key={index}
                          className={`${getStatusColor(
                            sc.status
                          )} first:rounded-l-full last:rounded-r-full`}
                          style={{ width: `${width}%` }}
                          title={`${sc.status}: ${sc.count}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {project.statusCounts.map((sc, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(
                            sc.status
                          )}`}
                        />
                        <span className="text-neutral-400">
                          {sc.status.replace("_", " ").toLowerCase()}:{" "}
                          {sc.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
