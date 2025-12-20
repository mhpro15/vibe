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
    <div className="mb-6 md:mb-8 -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 whitespace-nowrap shrink-0 transition-colors hover:border-neutral-700">
          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
          <span className="text-neutral-400 text-sm font-medium">
            In Progress
          </span>
          <span className="text-white font-bold text-base">
            {inProgressCount}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 whitespace-nowrap shrink-0 transition-colors hover:border-neutral-700">
          <div className="w-2 h-2 rounded-full bg-neutral-500"></div>
          <span className="text-neutral-400 text-sm font-medium">Backlog</span>
          <span className="text-white font-bold text-base">
            {backlogCount}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 whitespace-nowrap shrink-0 transition-colors hover:border-neutral-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-neutral-400 text-sm font-medium">
            Done this week
          </span>
          <span className="text-white font-bold text-base">
            {doneThisWeekCount}
          </span>
        </div>
        {dueTodayCount > 0 && (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-900/30 rounded-xl px-4 py-2.5 whitespace-nowrap shrink-0 transition-colors hover:bg-red-900/30">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-bold text-sm">
              {dueTodayCount} due today
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
