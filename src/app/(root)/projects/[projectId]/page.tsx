import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/actions/auth";
import { getProjectById } from "@/lib/actions/project";
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
  const project = await getProjectById(projectId);

  if (!project) {
    notFound();
  }

  // Check if user is owner or admin
  const canEdit = project.ownerId === session.user.id;

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
          <span className="text-gray-900 dark:text-white font-medium">
            {project.name}
          </span>
        </nav>
      </div>

      <ProjectDetailClient project={project} canEdit={canEdit} />
    </div>
  );
}
