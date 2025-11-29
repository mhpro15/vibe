import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import { getIssueById } from "@/lib/actions/issue";
import { IssueDetailClient } from "./IssueDetailClient";

interface IssuePageProps {
  params: Promise<{
    projectId: string;
    issueId: string;
  }>;
}

export default async function IssuePage({ params }: IssuePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const { projectId, issueId } = await params;
  const issue = await getIssueById(issueId);

  if (!issue || issue.projectId !== projectId) {
    notFound();
  }

  // Transform labels to flatten the structure
  const transformedIssue = {
    ...issue,
    labels: issue.labels.map((il) => ({
      id: il.label.id,
      name: il.label.name,
      color: il.label.color,
    })),
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/projects"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Projects
          </Link>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <Link
            href={`/projects/${projectId}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {issue.project.name}
          </Link>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {issue.title}
          </span>
        </nav>
      </div>

      <IssueDetailClient issue={transformedIssue} currentUserId={session.user.id} />
    </div>
  );
}
