"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PriorityBarChartProps {
  data: { name: string; value: number; priority: string }[];
}

// Priority colors matching dark theme
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#a1a1aa", // zinc-400 (more visible on dark)
  MEDIUM: "#fbbf24", // amber-400 (matches --warning)
  HIGH: "#f97316", // orange-500 (brighter)
  URGENT: "#ef4444", // red-500 (matches --danger)
};

export function PriorityBarChart({ data }: PriorityBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-neutral-500 text-sm">
        No data to display
      </div>
    );
  }

  // Sort by priority order
  const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  const sortedData = [...data].sort(
    (a, b) =>
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={sortedData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        layout="vertical"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          horizontal={false}
        />
        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#9ca3af"
          fontSize={12}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#171717",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#ededed",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
          formatter={(value: number) => [`${value} issues`, "Count"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PRIORITY_COLORS[entry.priority] || "#6b7280"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
