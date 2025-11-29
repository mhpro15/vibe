"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatusPieChartProps {
  data: { name: string; value: number; status: string }[];
}

// Status colors matching the app's design
const STATUS_COLORS: Record<string, string> = {
  BACKLOG: "#6b7280", // neutral-500
  TODO: "#3b82f6", // blue-500
  IN_PROGRESS: "#8b5cf6", // violet-500
  IN_REVIEW: "#f59e0b", // amber-500
  DONE: "#10b981", // emerald-500
  CANCELLED: "#6b7280", // neutral-500
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-neutral-500 text-sm">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status] || "#6b7280"}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#262626",
            border: "1px solid #404040",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number) => [`${value} issues`, "Count"]}
        />
        <Legend
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => (
            <span className="text-neutral-400 text-xs">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
