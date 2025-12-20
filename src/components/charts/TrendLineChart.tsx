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
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis 
          dataKey="date" 
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
          itemStyle={{ fontSize: "12px", fontWeight: "500" }}
          labelStyle={{ color: "#ffffff", marginBottom: "4px", fontWeight: "bold" }}
          cursor={{ stroke: "#374151", strokeWidth: 1 }}
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
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ fill: "#60a5fa", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 6, fill: "#3b82f6" }}
          name="Created"
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ fill: "#34d399", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 6, fill: "#22c55e" }}
          name="Completed"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
