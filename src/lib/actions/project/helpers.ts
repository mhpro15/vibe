"use server";

import { prisma } from "@/lib/prisma";

/**
 * Check if a user is a member of a team
 */
export async function isTeamMember(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
  return !!member;
}

/**
 * Check if a user is an admin or owner of a team
 */
export async function isTeamAdmin(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
  return member?.role === "ADMIN" || member?.role === "OWNER";
}

/**
 * Check if a user is the owner of a project
 */
export async function isProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  return project?.ownerId === userId;
}

/**
 * Result type for project actions
 */
export type ProjectActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};
