"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { isTeamMember } from "./helpers";

/**
 * Get a project by ID with full details
 */
export async function getProjectById(projectId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      team: {
        select: { id: true, name: true },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
      labels: {
        orderBy: { name: "asc" },
      },
      customStatuses: {
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  // Check if user is a member of the team
  if (!(await isTeamMember(session.user.id, project.teamId))) {
    return null;
  }

  // Check if favorited
  const favorite = await prisma.userFavoriteProject.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId,
      },
    },
  });

  return {
    ...project,
    isFavorite: !!favorite,
  };
}

/**
 * Get all projects for a specific team
 */
export async function getTeamProjects(teamId: string, includeArchived = false) {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  // Check team membership
  if (!(await isTeamMember(session.user.id, teamId))) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: {
      teamId,
      deletedAt: null,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: {
      owner: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => ({
    ...p,
    isFavorite: p.favorites.length > 0,
    favorites: undefined,
  }));
}

/**
 * Get all projects the current user has access to
 */
export async function getUserProjects() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  // Get all teams user is a member of
  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
      deletedAt: null,
      isArchived: false,
    },
    include: {
      team: {
        select: { id: true, name: true },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return projects.map((p) => ({
    ...p,
    isFavorite: p.favorites.length > 0,
    favorites: undefined,
  }));
}

/**
 * Get all favorited projects for the current user
 */
export async function getFavoriteProjects() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  const favorites = await prisma.userFavoriteProject.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        include: {
          team: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: {
              issues: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
  });

  return favorites
    .filter((f) => f.project.deletedAt === null)
    .map((f) => ({
      ...f.project,
      isFavorite: true,
    }));
}
