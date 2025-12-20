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
    ? "bg-red-900/10 border border-red-900/20"
    : isDueSoon
    ? "bg-amber-900/10 border border-amber-900/20"
    : "bg-neutral-900/50 border border-neutral-800";

  const titleColorClass = isDueToday
    ? "text-red-400"
    : isDueSoon
    ? "text-amber-400"
    : "text-neutral-400";

  const Icon = isDueToday ? Clock : isDueSoon ? CalendarClock : null;
  const totalCount = issues.length + (showMoreCount || 0);

  return (
    <section className={`${containerClass} rounded-xl md:rounded-2xl p-4 md:p-6`}>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          {Icon && <Icon className={`w-4 h-4 md:w-5 md:h-5 ${titleColorClass}`} />}
          <h2 className={`text-xs md:text-sm font-bold ${titleColorClass} uppercase tracking-[0.15em]`}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <span className="text-[10px] md:text-xs text-neutral-500 font-bold bg-neutral-800 px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-6 md:p-10 text-center">
          <p className="text-neutral-400 text-sm md:text-base font-medium">{emptyMessage}</p>
          {emptySubMessage && (
            <p className="text-neutral-600 text-xs md:text-sm mt-1">
              {emptySubMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/projects/${issue.projectId}/issues/${issue.id}`}
              className={`flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-4 rounded-xl bg-neutral-900/40 hover:bg-neutral-800/60 border border-neutral-800/50 hover:border-neutral-700/50 transition-all group ${
                isDueToday ? "hover:bg-red-900/5" : isDueSoon ? "hover:bg-amber-900/5" : ""
              }`}
            >
              <div
                className={`w-1 md:w-1.5 h-8 md:h-10 rounded-full ${getStatusColor(
                  issue.status
                )} shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
              ></div>
              <div className="flex-1 min-w-0">
                <span className="text-sm md:text-base font-semibold text-neutral-200 group-hover:text-white transition-colors truncate block">
                  {issue.title}
                </span>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-500 font-medium mt-1">
                  <span className="truncate group-hover:text-neutral-400 transition-colors">{issue.project.name}</span>
                  {issue.dueDate && (
                    <>
                      <span className="text-neutral-700">•</span>
                      <span className={`${isDueToday ? "text-red-400" : isDueSoon ? "text-amber-400" : "text-neutral-500"}`}>
                        {isDueToday ? "Due Today" : `Due ${new Date(issue.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {getPriorityIcon(issue.priority)}
              </div>
            </Link>
          ))}
          
          {showMoreCount && showMoreCount > 0 && (
            <button className="w-full py-3 text-xs md:text-sm font-bold text-neutral-500 hover:text-violet-400 transition-colors uppercase tracking-widest border border-dashed border-neutral-800 rounded-xl mt-2 hover:border-violet-900/30 hover:bg-violet-900/5">
              + {showMoreCount} more issues
            </button>
          )}
        </div>
      )}
    </section>
  );
}
