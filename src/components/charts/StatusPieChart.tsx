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

// Status colors matching the dark theme design
const STATUS_COLORS: Record<string, string> = {
  BACKLOG: "#525252", // neutral-600 (darker for dark theme)
  TODO: "#60a5fa", // blue-400 (matches --primary)
  IN_PROGRESS: "#a78bfa", // violet-400 (brighter violet)
  IN_REVIEW: "#fbbf24", // amber-400 (matches --warning)
  DONE: "#34d399", // emerald-400 (matches --success brighter)
  CANCELLED: "#737373", // neutral-500
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
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
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
            backgroundColor: "#171717",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#ededed",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
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
