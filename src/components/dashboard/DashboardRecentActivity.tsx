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
    <div className="space-y-6 md:space-y-8">
      {/* Recent Activity */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.15em] mb-4 md:mb-6">
          Recent Activity
        </h2>
        <div className="space-y-4 md:space-y-6">
          {recentActivity.map((issue) => (
            <Link
              key={issue.id}
              href={`/projects/${issue.projectId}/issues/${issue.id}`}
              className="flex items-start gap-3 md:gap-4 group"
            >
              <div className="mt-0.5">
                <Avatar
                  src={issue.assignee?.image}
                  name={issue.assignee?.name || "U"}
                  size="md"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm md:text-base text-neutral-400 leading-relaxed group-hover:text-neutral-200 transition-colors">
                  <span className="text-white font-bold">
                    {issue.assignee?.name || "Someone"}
                  </span>{" "}
                  updated <span className="text-neutral-200 font-medium">{issue.title}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] md:text-xs text-neutral-500 font-medium">
                    {getTimeAgo(issue.updatedAt)}
                  </span>
                  <span className="text-neutral-700">•</span>
                  <span className="text-[10px] md:text-xs text-neutral-500 font-medium truncate">
                    {issue.project.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Comments */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-xl md:rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          <h2 className="text-xs md:text-sm font-bold text-neutral-400 uppercase tracking-[0.15em]">
            Recent Comments
          </h2>
        </div>
        <div className="space-y-4 md:space-y-6">
          {recentComments.length === 0 ? (
            <p className="text-neutral-600 text-sm italic">
              No recent comments
            </p>
          ) : (
            recentComments.map((comment) => (
              <Link
                key={comment.id}
                href={`/projects/${comment.issue.projectId}/issues/${comment.issue.id}`}
                className="block p-3 md:p-4 rounded-xl bg-neutral-800/30 hover:bg-neutral-800/50 border border-neutral-700/30 transition-all group"
              >
                <p className="text-sm md:text-base text-neutral-300 line-clamp-2 group-hover:text-white transition-colors italic">
                  &quot;{comment.content}&quot;
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] md:text-xs text-violet-400 font-bold truncate mr-2">
                    {comment.issue.title}
                  </span>
                  <span className="text-[10px] md:text-xs text-neutral-500 font-medium shrink-0">
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
