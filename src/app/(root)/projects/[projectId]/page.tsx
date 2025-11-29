import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import { getProjectById } from "@/lib/actions/project";
import { getProjectIssues } from "@/lib/actions/issue";
import { ProjectDetailClient } from "./ProjectDetailClient";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  const { projectId } = await params;
  const [project, issues] = await Promise.all([
    getProjectById(projectId),
    getProjectIssues(projectId),
  ]);

  if (!project) {
    notFound();
  }

  // Check if user is owner or admin
  const canEdit = project.ownerId === session.user.id;

  // Transform issues for Kanban board
  const kanbanIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    status: issue.customStatusId ?? issue.status,
    priority: issue.priority,
    position: issue.position,
    dueDate: issue.dueDate,
    projectId: issue.projectId,
    assignee: issue.assignee,
    labels: issue.labels.map((il) => ({
      id: il.label.id,
      name: il.label.name,
      color: il.label.color,
    })),
    subtasks: issue.subtasks,
  }));

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/projects"
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Projects
          </Link>
          <svg
            className="w-4 h-4 text-neutral-600"
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
          <span className="text-white font-medium">
            {project.name}
          </span>
        </nav>
      </div>

      <ProjectDetailClient
        project={project}
        canEdit={canEdit}
        issues={kanbanIssues}
      />
    </div>
  );
}
