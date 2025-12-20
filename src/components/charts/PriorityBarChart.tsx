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
  Legend,
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
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          vertical={false}
        />
        <XAxis 
          dataKey="name" 
          stroke="#9ca3af" 
          fontSize={10} 
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          stroke="#9ca3af" 
          fontSize={10} 
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#171717",
            border: "1px solid #374151",
            borderRadius: "12px",
            padding: "8px 12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          }}
          itemStyle={{ color: "#ffffff", fontSize: "12px", fontWeight: "500" }}
          labelStyle={{ display: "none" }}
          cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
          formatter={(value: number) => [`${value} issues`, "Count"]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
