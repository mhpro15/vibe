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

// Priority colors
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#6b7280", // neutral-500
  MEDIUM: "#facc15", // yellow-400
  HIGH: "#fb923c", // orange-400
  URGENT: "#f87171", // red-400
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
          stroke="#404040"
          horizontal={false}
        />
        <XAxis type="number" stroke="#737373" fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#737373"
          fontSize={12}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#262626",
            border: "1px solid #404040",
            borderRadius: "8px",
            color: "#fff",
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
