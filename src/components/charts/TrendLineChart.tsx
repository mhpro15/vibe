"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendLineChartProps {
  creationData: { date: string; count: number }[];
  completionData: { date: string; count: number }[];
}

export function TrendLineChart({
  creationData,
  completionData,
}: TrendLineChartProps) {
  // Merge data by date
  const mergedData = creationData.map((item, index) => ({
    date: item.date,
    created: item.count,
    completed: completionData[index]?.count ?? 0,
  }));

  if (mergedData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-neutral-500 text-sm">
        No data to display
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={mergedData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
        <XAxis
          dataKey="date"
          stroke="#737373"
          fontSize={12}
          tickLine={false}
        />
        <YAxis stroke="#737373" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#262626",
            border: "1px solid #404040",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => (
            <span className="text-neutral-400 text-xs capitalize">{value}</span>
          )}
        />
        <Line
          type="monotone"
          dataKey="created"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: "#8b5cf6", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
          name="Created"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5 }}
          name="Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
