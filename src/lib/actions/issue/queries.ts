"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { IssueStatus, IssuePriority } from "@/generated/prisma/client";
import { isTeamMember, getProjectTeamId } from "./helpers";

/**
 * Get an issue by ID with full details
 */
export async function getIssueById(issueId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      project: {
        select: { id: true, name: true, teamId: true },
      },
      creator: {
        select: { id: true, name: true, image: true },
      },
      assignee: {
        select: { id: true, name: true, image: true },
      },
      labels: {
        include: {
          label: true,
        },
      },
      customStatus: true,
      comments: {
        where: { deletedAt: null },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      subtasks: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!issue) {
    return null;
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return null;
  }

  return issue;
}

/**
 * Get all issues for a project with optional filters
 */
export async function getProjectIssues(
  projectId: string,
  filters?: {
    status?: IssueStatus;
    priority?: IssuePriority;
    assigneeId?: string;
    labelIds?: string[];
    search?: string;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  const teamId = await getProjectTeamId(projectId);
  if (!teamId || !(await isTeamMember(session.user.id, teamId))) {
    return [];
  }

  const where: Record<string, unknown> = {
    projectId,
    deletedAt: null,
  };

  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters?.labelIds?.length) {
    where.labels = { some: { labelId: { in: filters.labelIds } } };
  }
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const issues = await prisma.issue.findMany({
    where,
    include: {
      assignee: {
        select: { id: true, name: true, image: true },
      },
      labels: {
        include: {
          label: true,
        },
      },
      subtasks: {
        select: { id: true, isCompleted: true },
        orderBy: { position: "asc" },
      },
      _count: {
        select: { comments: { where: { deletedAt: null } } },
      },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return issues;
}

/**
 * Get issue change log
 */
export async function getIssueChangeLog(issueId: string, limit = 50) {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue || !(await isTeamMember(session.user.id, issue.project.teamId))) {
    return [];
  }

  const changes = await prisma.issueChange.findMany({
    where: { issueId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return changes;
}

/**
 * Get Kanban board data for a project
 */
export async function getKanbanBoard(projectId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const teamId = await getProjectTeamId(projectId);
  if (!teamId || !(await isTeamMember(session.user.id, teamId))) {
    return null;
  }

  const [issues, customStatuses] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId, deletedAt: null },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
      orderBy: { position: "asc" },
    }),
    prisma.customStatus.findMany({
      where: { projectId },
      orderBy: { position: "asc" },
    }),
  ]);

  // Group issues by status
  const columns: Record<string, typeof issues> = {
    BACKLOG: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  // Add custom status columns
  for (const status of customStatuses) {
    columns[status.id] = [];
  }

  // Sort issues into columns
  for (const issue of issues) {
    if (issue.customStatusId && columns[issue.customStatusId]) {
      columns[issue.customStatusId].push(issue);
    } else if (columns[issue.status]) {
      columns[issue.status].push(issue);
    }
  }

  return { columns, customStatuses };
}
