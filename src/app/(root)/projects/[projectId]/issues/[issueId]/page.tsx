import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import { getIssueById, getSubtasks } from "@/lib/actions/issue";
import { prisma } from "@/lib/prisma";
import { IssueDetailClient } from "./IssueDetailClient";
import { ChevronRight } from "lucide-react";

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

  // Fetch team members for assignee selection
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: issue.project.teamId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  const teamMembersList = teamMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
  }));

  // Fetch subtasks
  const subtasks = await getSubtasks(issueId);

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
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link
          href="/projects"
          className="text-neutral-500 hover:text-white transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="w-4 h-4 text-neutral-600" />
        <Link
          href={`/projects/${projectId}?tab=issues`}
          className="text-neutral-500 hover:text-white transition-colors"
        >
          {issue.project.name}
        </Link>
        <ChevronRight className="w-4 h-4 text-neutral-600" />
        <span className="text-white truncate max-w-[200px]">{issue.title}</span>
      </nav>

      <IssueDetailClient
        issue={transformedIssue}
        currentUserId={session.user.id}
        teamMembers={teamMembersList}
        subtasks={subtasks}
      />
    </div>
  );
}
