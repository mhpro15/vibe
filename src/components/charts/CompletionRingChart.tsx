"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CompletionRingChartProps {
  completionRate: number;
  totalIssues: number;
  doneCount: number;
  inProgressCount?: number;
}

export function CompletionRingChart({
  completionRate,
  totalIssues,
  doneCount,
  inProgressCount = 0,
}: CompletionRingChartProps) {
  const remainingCount = totalIssues - doneCount - inProgressCount;

  const data = [
    { name: "Completed", value: doneCount, color: "#34d399" },
    { name: "In Progress", value: inProgressCount, color: "#60a5fa" },
    { name: "Remaining", value: remainingCount, color: "#374151" },
  ].filter((item) => item.value > 0);

  // If no data, show empty state
  if (totalIssues === 0) {
    return (
      <div className="h-[250px] flex flex-col items-center justify-center text-neutral-500 text-sm">
        <div className="w-32 h-32 rounded-full border-4 border-neutral-700 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-neutral-600">0%</span>
        </div>
        <p>No issues yet</p>
      </div>
    );
  }

  return (
    <div className="h-[250px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: "#171717",
              border: "1px solid #374151",
              borderRadius: "12px",
              padding: "8px 12px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            }}
            itemStyle={{ fontSize: "12px", fontWeight: "500", color: "#ffffff" }}
            labelStyle={{ display: "none" }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-white">{completionRate}%</span>
        <span className="text-xs text-neutral-500">Complete</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-neutral-400">Done ({doneCount})</span>
        </div>
        {inProgressCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-neutral-400">
              In Progress ({inProgressCount})
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-600" />
          <span className="text-neutral-400">Remaining ({remainingCount})</span>
        </div>
      </div>
    </div>
  );
}
