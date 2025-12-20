import { Clock } from "lucide-react";

interface DashboardStatsProps {
  inProgressCount: number;
  backlogCount: number;
  doneThisWeekCount: number;
  dueTodayCount: number;
}

export function DashboardStats({
  inProgressCount,
  backlogCount,
  doneThisWeekCount,
  dueTodayCount,
}: DashboardStatsProps) {
  return (
    <div className="mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-3 py-2 whitespace-nowrap shrink-0">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-500"></div>
          <span className="text-neutral-400 text-xs md:text-sm">
            In Progress
          </span>
          <span className="text-white font-medium text-xs md:text-sm">
            {inProgressCount}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-3 py-2 whitespace-nowrap shrink-0">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-neutral-500"></div>
          <span className="text-neutral-400 text-xs md:text-sm">Backlog</span>
          <span className="text-white font-medium text-xs md:text-sm">
            {backlogCount}
          </span>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700/50 rounded-lg px-3 py-2 whitespace-nowrap shrink-0">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-400 text-xs md:text-sm">
            Done this week
          </span>
          <span className="text-white font-medium text-xs md:text-sm">
            {doneThisWeekCount}
          </span>
        </div>
        {dueTodayCount > 0 && (
          <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 rounded-lg px-3 py-2 whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
            <span className="text-red-400 font-medium text-xs md:text-sm">
              {dueTodayCount} due today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
