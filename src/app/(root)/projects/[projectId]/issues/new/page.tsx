import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { CreateIssueForm } from "./CreateIssueForm";
import { ChevronRight, Plus } from "lucide-react";

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
                select: { id: true, name: true, email: true, image: true },
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
    email: m.user.email,
    image: m.user.image,
  }));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8">
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
          {project.name}
        </Link>
        <ChevronRight className="w-4 h-4 text-neutral-600" />
        <span className="text-white">New Issue</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Plus className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Create New Issue
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Add a new issue to {project.name}
          </p>
        </div>
      </div>

      <CreateIssueForm
        projectId={projectId}
        projectName={project.name}
        labels={project.labels}
        teamMembers={teamMembers}
      />
    </div>
  );
}
