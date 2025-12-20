import Link from "next/link";
import {
  AlertTriangle,
  Signal,
  SignalMedium,
  SignalLow,
  Clock,
  CalendarClock,
} from "lucide-react";

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: Date | null;
  project: {
    name: string;
  };
}

interface DashboardIssuesListProps {
  title: string;
  issues: Issue[];
  type: "due-today" | "in-progress" | "due-soon" | "up-next";
  emptyMessage?: string;
  emptySubMessage?: string;
  showMoreCount?: number;
}

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

export function DashboardIssuesList({
  title,
  issues,
  type,
  emptyMessage,
  emptySubMessage,
  showMoreCount,
}: DashboardIssuesListProps) {
  const isDueToday = type === "due-today";
  const isDueSoon = type === "due-soon";

  const containerClass = isDueToday
    ? "bg-red-900/20 border border-red-700/30"
    : isDueSoon
    ? "bg-amber-900/20 border border-amber-700/30"
    : "bg-neutral-900/50 border border-neutral-700/50";

  const titleColorClass = isDueToday
    ? "text-red-400"
    : isDueSoon
    ? "text-amber-400"
    : "text-white";

  const Icon = isDueToday ? Clock : isDueSoon ? CalendarClock : null;

  return (
    <section className={`${containerClass} rounded-lg md:rounded-xl p-3 md:p-4`}>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-1.5 md:gap-2">
          {Icon && <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${titleColorClass}`} />}
          <h2 className={`text-xs md:text-sm font-medium ${titleColorClass} uppercase tracking-wider`}>
            {title}
          </h2>
        </div>
        {showMoreCount && showMoreCount > 0 && (
          <span className="text-[10px] md:text-xs text-neutral-500">
            +{showMoreCount} more
          </span>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="border border-dashed border-neutral-700 rounded-lg p-4 md:p-6 text-center">
          <p className="text-neutral-400 text-xs md:text-sm">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-neutral-500 text-[10px] md:text-xs mt-1">
              {emptySubMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/projects/${issue.projectId}/issues/${issue.id}`}
              className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 border border-transparent transition-all group ${
                isDueToday ? "hover:border-red-700/30" : isDueSoon ? "hover:border-amber-700/30" : "hover:border-neutral-700/50"
              }`}
            >
              <div
                className={`w-0.5 md:w-1 h-6 md:h-8 rounded-full ${getStatusColor(
                  issue.status
                )}`}
              ></div>
              <div className="flex-1 min-w-0">
                <span className="text-xs md:text-sm text-white truncate block">
                  {issue.title}
                </span>
                <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-neutral-500 mt-0.5">
                  <span className="truncate">{issue.project.name}</span>
                  {isDueSoon && issue.dueDate && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-amber-400 hidden sm:inline">
                        Due{" "}
                        {new Date(issue.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className={`flex items-center gap-2 ${!isDueToday && !isDueSoon ? "hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity" : "shrink-0"}`}>
                {getPriorityIcon(issue.priority)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
