import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { CreateIssueForm } from "./CreateIssueForm";

interface NewIssuePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function NewIssuePage({ params }: NewIssuePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const { projectId } = await params;

  // Fetch project with labels and team members
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      deletedAt: null,
    },
    include: {
      labels: {
        orderBy: { name: "asc" },
      },
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user is a team member
  const isMember = project.team.members.some(
    (m) => m.userId === session.user.id
  );
  if (!isMember) {
    notFound();
  }

  const teamMembers = project.team.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image,
  }));

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
            {project.name}
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
          <span className="text-gray-900 dark:text-white font-medium">
            New Issue
          </span>
        </nav>
      </div>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Issue
        </h1>

        <CreateIssueForm
          projectId={projectId}
          projectName={project.name}
          labels={project.labels}
          teamMembers={teamMembers}
        />
      </div>
    </div>
  );
}
