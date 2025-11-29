"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { IssueStatus, IssuePriority } from "@/generated/prisma/client";

export type IssueActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

// Helper to check if user is team member
async function isTeamMember(userId: string, teamId: string) {
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

// Helper to get project's team ID
async function getProjectTeamId(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  return project?.teamId;
}

// FR-030: Create Issue
export async function createIssueAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const priority = (formData.get("priority") as IssuePriority) || "MEDIUM";
  const assigneeId = formData.get("assigneeId") as string | null;
  const dueDate = formData.get("dueDate") as string | null;
  const labelIds = formData.getAll("labelIds") as string[];

  // Validate title
  if (!title || title.length < 1 || title.length > 200) {
    return {
      success: false,
      error: "Issue title must be between 1 and 200 characters",
    };
  }

  // Validate description
  if (description && description.length > 5000) {
    return {
      success: false,
      error: "Description must be less than 5000 characters",
    };
  }

  // Check project and team membership
  const teamId = await getProjectTeamId(projectId);
  if (!teamId || !(await isTeamMember(session.user.id, teamId))) {
    return { success: false, error: "You don't have access to this project" };
  }

  try {
    // Get max position for ordering
    const maxPosition = await prisma.issue.findFirst({
      where: { projectId, status: "BACKLOG" },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        priority,
        projectId,
        creatorId: session.user.id,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        position: (maxPosition?.position ?? -1) + 1,
        labels: {
          connect: labelIds.map((id) => ({ id })),
        },
      },
    });

    // Create activity log
    await prisma.issueActivityLog.create({
      data: {
        issueId: issue.id,
        userId: session.user.id,
        action: "CREATED",
        details: { title },
      },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: { issueId: issue.id } };
  } catch (error) {
    console.error("Create issue error:", error);
    return { success: false, error: "Failed to create issue" };
  }
}

// FR-031: Edit Issue
export async function updateIssueAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const priority = formData.get("priority") as IssuePriority;
  const dueDate = formData.get("dueDate") as string | null;

  // Validate
  if (!title || title.length < 1 || title.length > 200) {
    return {
      success: false,
      error: "Issue title must be between 1 and 200 characters",
    };
  }

  if (description && description.length > 5000) {
    return {
      success: false,
      error: "Description must be less than 5000 characters",
    };
  }

  // Get issue and check permissions
  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const oldIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { title: true, description: true, priority: true, dueDate: true },
    });

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    // Log changes
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (oldIssue?.title !== title) changes.title = { from: oldIssue?.title, to: title };
    if (oldIssue?.description !== description) changes.description = { from: oldIssue?.description, to: description };
    if (oldIssue?.priority !== priority) changes.priority = { from: oldIssue?.priority, to: priority };

    if (Object.keys(changes).length > 0) {
      await prisma.issueActivityLog.create({
        data: {
          issueId,
          userId: session.user.id,
          action: "UPDATED",
          details: changes,
        },
      });
    }

    revalidatePath(`/projects/${issue.projectId}`);
    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Update issue error:", error);
    return { success: false, error: "Failed to update issue" };
  }
}

// FR-032: Delete Issue (Soft delete)
export async function deleteIssueAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    await prisma.issue.update({
      where: { id: issueId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/projects/${issue.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete issue error:", error);
    return { success: false, error: "Failed to delete issue" };
  }
}

// FR-033: Assign Issue
export async function assignIssueAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const assigneeId = formData.get("assigneeId") as string | null;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } }, assignee: { select: { name: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  // If assigning to someone, verify they're a team member
  if (assigneeId && !(await isTeamMember(assigneeId, issue.project.teamId))) {
    return { success: false, error: "Assignee is not a team member" };
  }

  try {
    const oldAssignee = issue.assignee?.name || null;

    await prisma.issue.update({
      where: { id: issueId },
      data: { assigneeId: assigneeId || null },
    });

    // Get new assignee name
    let newAssigneeName = null;
    if (assigneeId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { name: true },
      });
      newAssigneeName = newAssignee?.name;
    }

    await prisma.issueActivityLog.create({
      data: {
        issueId,
        userId: session.user.id,
        action: "ASSIGNED",
        details: { from: oldAssignee, to: newAssigneeName },
      },
    });

    revalidatePath(`/projects/${issue.projectId}`);
    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Assign issue error:", error);
    return { success: false, error: "Failed to assign issue" };
  }
}

// FR-034: Change Status
export async function changeStatusAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const status = formData.get("status") as IssueStatus;
  const customStatusId = formData.get("customStatusId") as string | null;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const oldStatus = issue.status;

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        status,
        customStatusId: customStatusId || null,
      },
    });

    await prisma.issueActivityLog.create({
      data: {
        issueId,
        userId: session.user.id,
        action: "STATUS_CHANGED",
        details: { from: oldStatus, to: status },
      },
    });

    revalidatePath(`/projects/${issue.projectId}`);
    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Change status error:", error);
    return { success: false, error: "Failed to change status" };
  }
}

// FR-035: Add/Remove Labels
export async function updateLabelsAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const labelIds = formData.getAll("labelIds") as string[];

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      project: { select: { teamId: true } },
      labels: { select: { id: true, name: true } },
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const oldLabels = issue.labels.map((l) => l.name);

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        labels: {
          set: labelIds.map((id) => ({ id })),
        },
      },
    });

    // Get new label names
    const newLabels = await prisma.label.findMany({
      where: { id: { in: labelIds } },
      select: { name: true },
    });

    await prisma.issueActivityLog.create({
      data: {
        issueId,
        userId: session.user.id,
        action: "LABELS_CHANGED",
        details: { from: oldLabels, to: newLabels.map((l) => l.name) },
      },
    });

    revalidatePath(`/projects/${issue.projectId}`);
    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Update labels error:", error);
    return { success: false, error: "Failed to update labels" };
  }
}

// FR-036: Add Comment
export async function addCommentAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const content = formData.get("content") as string;

  if (!content || content.length < 1 || content.length > 10000) {
    return {
      success: false,
      error: "Comment must be between 1 and 10000 characters",
    };
  }

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        issueId,
        authorId: session.user.id,
      },
    });

    await prisma.issueActivityLog.create({
      data: {
        issueId,
        userId: session.user.id,
        action: "COMMENTED",
        details: { commentId: comment.id },
      },
    });

    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true, data: { commentId: comment.id } };
  } catch (error) {
    console.error("Add comment error:", error);
    return { success: false, error: "Failed to add comment" };
  }
}

// FR-037: Edit Comment
export async function updateCommentAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const commentId = formData.get("commentId") as string;
  const content = formData.get("content") as string;

  if (!content || content.length < 1 || content.length > 10000) {
    return {
      success: false,
      error: "Comment must be between 1 and 10000 characters",
    };
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId, deletedAt: null },
    include: { issue: { include: { project: { select: { teamId: true, id: true } } } } },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  // Only author can edit their comment
  if (comment.authorId !== session.user.id) {
    return { success: false, error: "You can only edit your own comments" };
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: { content },
    });

    revalidatePath(`/projects/${comment.issue.project.id}/issues/${comment.issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Update comment error:", error);
    return { success: false, error: "Failed to update comment" };
  }
}

// FR-038: Delete Comment
export async function deleteCommentAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const commentId = formData.get("commentId") as string;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId, deletedAt: null },
    include: { issue: { include: { project: { select: { teamId: true, id: true } } } } },
  });

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  // Only author can delete their comment
  if (comment.authorId !== session.user.id) {
    return { success: false, error: "You can only delete your own comments" };
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/projects/${comment.issue.project.id}/issues/${comment.issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}

// FR-052: Update Issue Position (for Kanban drag-and-drop)
export async function updateIssuePositionAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const newStatus = formData.get("status") as IssueStatus;
  const newPosition = parseInt(formData.get("position") as string);

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const oldStatus = issue.status;

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: newStatus,
        position: newPosition,
      },
    });

    if (oldStatus !== newStatus) {
      await prisma.issueActivityLog.create({
        data: {
          issueId,
          userId: session.user.id,
          action: "STATUS_CHANGED",
          details: { from: oldStatus, to: newStatus },
        },
      });
    }

    revalidatePath(`/projects/${issue.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Update position error:", error);
    return { success: false, error: "Failed to update issue position" };
  }
}

// Data fetching functions
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
      labels: true,
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
    where.labels = { some: { id: { in: filters.labelIds } } };
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
      labels: true,
      _count: {
        select: { comments: { where: { deletedAt: null } } },
      },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
  });

  return issues;
}

export async function getIssueActivityLog(issueId: string, limit = 50) {
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

  const activities = await prisma.issueActivityLog.findMany({
    where: { issueId },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return activities;
}

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
        labels: true,
      },
      orderBy: { position: "asc" },
    }),
    prisma.customStatus.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
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
