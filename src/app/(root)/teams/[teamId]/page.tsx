import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { TeamDetailClient } from "./TeamDetailClient";

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamPageProps) {
  const { teamId } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/signin");
  }

  // Fetch team with members
  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
      deletedAt: null,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      projects: {
        where: { deletedAt: null },
        select: { id: true },
      },
      _count: {
        select: {
          members: true,
          projects: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Check if user is a member
  const membership = team.members.find((m) => m.userId === session.user.id);
  if (!membership) {
    notFound();
  }

  // Transform data for client component
  const teamData = {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
    owner: team.owner,
    memberCount: team._count.members,
    projectCount: team._count.projects,
    members: team.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user,
    })),
  };

  return (
    <TeamDetailClient
      team={teamData}
      currentUserId={session.user.id}
      currentUserRole={membership.role}
    />
  );
}
