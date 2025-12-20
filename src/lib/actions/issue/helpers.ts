"use server";

import { prisma } from "@/lib/prisma";
import { IssueActivityType } from "@/generated/prisma/client";

/**
 * Result type for issue actions
 */
export type IssueActionResult = {
  success: boolean;
  error?: string;
  source?: string;
  data?: {
    issueId?: string;
    commentId?: string;
    subtaskId?: string;
    isCompleted?: boolean;
  };
};

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
 * Get project's team ID
 */
export async function getProjectTeamId(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  return project?.teamId;
}

/**
 * Log an issue change
 */
export async function logIssueChange(
  issueId: string,
  userId: string,
  field: string,
  oldValue: string | null,
  newValue: string | null
) {
  await prisma.issueChange.create({
    data: {
      issueId,
      userId,
      field,
      oldValue,
      newValue,
    },
  });
}

/**
 * Log an issue activity
 */
export async function logIssueActivity(
  issueId: string,
  userId: string,
  type: IssueActivityType,
  details?: any
) {
  await prisma.issueActivity.create({
    data: {
      issueId,
      userId,
      type,
      details: details || {},
    },
  });
}
