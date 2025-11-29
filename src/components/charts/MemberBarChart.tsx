"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Avatar } from "@/components/ui/Avatar";

interface MemberStats {
  userId: string;
  userName: string;
  userImage: string | null;
  assignedCount: number;
  completedCount: number;
}

interface MemberBarChartProps {
  data: MemberStats[];
}

export function MemberBarChart({ data }: MemberBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-neutral-500 text-sm">
        No data to display
      </div>
    );
  }

  // Transform for chart
  const chartData = data.map((member) => ({
    name: member.userName.split(" ")[0], // First name only for space
    assigned: member.assignedCount,
    completed: member.completedCount,
    fullName: member.userName,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#374151"
          vertical={false}
        />
        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#171717",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#ededed",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
          formatter={(value: number, name: string) => [
            `${value} issues`,
            name === "assigned" ? "Assigned" : "Completed",
          ]}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;
            return item?.fullName || label;
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => (
            <span className="text-neutral-400 text-xs capitalize">{value}</span>
          )}
        />
        <Bar
          dataKey="assigned"
          fill="#60a5fa"
          radius={[4, 4, 0, 0]}
          name="Assigned"
        />
        <Bar
          dataKey="completed"
          fill="#34d399"
          radius={[4, 4, 0, 0]}
          name="Completed"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Alternative list view for member stats
export function MemberStatsList({ data }: MemberBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-neutral-500 text-sm py-8">
        No team members found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((member) => {
        const completionRate =
          member.assignedCount > 0
            ? Math.round((member.completedCount / member.assignedCount) * 100)
            : 0;

        return (
          <div
            key={member.userId}
            className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
          >
            <Avatar src={member.userImage} name={member.userName} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">
                {member.userName}
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span>{member.assignedCount} assigned</span>
                <span>•</span>
                <span className="text-emerald-400">
                  {member.completedCount} completed
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">
                {completionRate}%
              </div>
              <div className="text-xs text-neutral-500">completion</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
