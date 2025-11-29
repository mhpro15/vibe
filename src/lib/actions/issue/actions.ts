"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { IssuePriority } from "@/generated/prisma/client";
import {
  IssueActionResult,
  isTeamMember,
  getProjectTeamId,
  logIssueChange,
} from "./helpers";
import { notifyIssueAssigned } from "@/lib/actions/notification";
import { sendIssueAssignedEmail } from "@/lib/email";

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
  const labelIdsRaw = formData.get("labelIds") as string | null;
  const labelIds = labelIdsRaw ? labelIdsRaw.split(",").filter(Boolean) : [];

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
        labels:
          labelIds.length > 0
            ? {
                create: labelIds.map((labelId) => ({ labelId })),
              }
            : undefined,
      },
    });

    // Log creation
    await logIssueChange(issue.id, session.user.id, "created", null, title);

    // Notify assignee if different from creator
    if (assigneeId && assigneeId !== session.user.id) {
      // In-app notification
      await notifyIssueAssigned(
        assigneeId,
        issue.id,
        title,
        projectId,
        session.user.name || "Someone"
      );

      // Email notification
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { email: true },
      });
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      if (assignee?.email) {
        const issueUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/projects/${projectId}/issues/${issue.id}`;
        await sendIssueAssignedEmail(
          assignee.email,
          session.user.name || "Someone",
          title,
          project?.name || "a project",
          issueUrl
        );
      }
    }

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
    if (oldIssue?.title !== title) {
      await logIssueChange(
        issueId,
        session.user.id,
        "title",
        oldIssue?.title || null,
        title
      );
    }
    if (oldIssue?.description !== description) {
      await logIssueChange(
        issueId,
        session.user.id,
        "description",
        oldIssue?.description || null,
        description || null
      );
    }
    if (oldIssue?.priority !== priority) {
      await logIssueChange(
        issueId,
        session.user.id,
        "priority",
        oldIssue?.priority || null,
        priority
      );
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
