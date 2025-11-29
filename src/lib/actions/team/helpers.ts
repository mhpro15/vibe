"use server";

import { prisma } from "@/lib/prisma";

/**
 * Result type for team actions
 */
export type TeamActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
  teams?: Array<{
    id: string;
    name: string;
    memberCount: number;
    projectCount: number;
    role: "OWNER" | "ADMIN" | "MEMBER";
    owner: {
      name: string;
      image?: string | null;
    };
  }>;
};

/**
 * Check if a user is a member of a team
 */
export async function checkTeamMembership(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId },
    },
  });
  return member;
}

/**
 * Check if a user has admin privileges in a team
 */
export async function hasAdminPrivileges(userId: string, teamId: string) {
  const member = await checkTeamMembership(userId, teamId);
  return member && ["OWNER", "ADMIN"].includes(member.role);
}

/**
 * Check if a user is the owner of a team
 */
export async function isTeamOwner(userId: string, teamId: string) {
  const member = await checkTeamMembership(userId, teamId);
  return member?.role === "OWNER";
}
