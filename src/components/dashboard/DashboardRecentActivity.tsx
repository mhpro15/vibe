import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { MessageSquare, Layers } from "lucide-react";

interface ActivityIssue {
  id: string;
  title: string;
  projectId: string;
  updatedAt: Date;
  project: {
    name: string;
  };
  assignee: {
    name: string | null;
    image: string | null;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  issue: {
    id: string;
    title: string;
    projectId: string;
  };
}

interface DashboardRecentActivityProps {
  recentActivity: ActivityIssue[];
  recentComments: Comment[];
}

const getTimeAgo = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
};

export function DashboardRecentActivity({
  recentActivity,
  recentComments,
}: DashboardRecentActivityProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Recent Activity */}
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg md:rounded-xl p-3 md:p-4">
        <h2 className="text-xs md:text-sm font-medium text-white uppercase tracking-wider mb-3 md:mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3 md:space-y-4">
          {recentActivity.map((issue) => (
            <Link
              key={issue.id}
              href={`/projects/${issue.projectId}/issues/${issue.id}`}
              className="flex items-start gap-2 md:gap-3 group"
            >
              <div className="mt-1">
                <Avatar
                  src={issue.assignee?.image}
                  name={issue.assignee?.name || "U"}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-neutral-300 line-clamp-2 group-hover:text-white transition-colors">
                  <span className="text-white font-medium">
                    {issue.assignee?.name || "Someone"}
                  </span>{" "}
                  updated <span className="text-white">{issue.title}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] md:text-xs text-neutral-500">
                    {getTimeAgo(issue.updatedAt)}
                  </span>
                  <span className="text-[10px] md:text-xs text-neutral-600">
                    •
                  </span>
                  <span className="text-[10px] md:text-xs text-neutral-500 truncate">
                    {issue.project.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Comments */}
      <section className="bg-neutral-900/50 border border-neutral-700/50 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-violet-400" />
          <h2 className="text-xs md:text-sm font-medium text-white uppercase tracking-wider">
            Recent Comments
          </h2>
        </div>
        <div className="space-y-3 md:space-y-4">
          {recentComments.length === 0 ? (
            <p className="text-neutral-500 text-xs md:text-sm italic">
              No recent comments
            </p>
          ) : (
            recentComments.map((comment) => (
              <Link
                key={comment.id}
                href={`/projects/${comment.issue.projectId}/issues/${comment.issue.id}`}
                className="block p-2 md:p-2.5 rounded-lg bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/30 transition-all group"
              >
                <p className="text-xs md:text-sm text-neutral-300 line-clamp-2 group-hover:text-white transition-colors italic">
                  &quot;{comment.content}&quot;
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] md:text-xs text-violet-400 font-medium truncate mr-2">
                    {comment.issue.title}
                  </span>
                  <span className="text-[10px] md:text-xs text-neutral-500 shrink-0">
                    {getTimeAgo(comment.createdAt)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
