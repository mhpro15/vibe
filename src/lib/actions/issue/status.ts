"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { IssueStatus } from "@/generated/prisma/client";
import { IssueActionResult, isTeamMember, logIssueChange } from "./helpers";
import { notifyIssueAssigned } from "@/lib/actions/notification";
import { sendIssueAssignedEmail } from "@/lib/email";

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
    include: {
      project: { select: { teamId: true } },
      assignee: { select: { name: true } },
    },
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
    let newAssigneeName: string | null = null;
    if (assigneeId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { name: true },
      });
      newAssigneeName = newAssignee?.name || null;
    }

    await logIssueChange(
      issueId,
      session.user.id,
      "assignee",
      oldAssignee,
      newAssigneeName
    );

    // Notify new assignee if they're different from the person assigning
    if (assigneeId && assigneeId !== session.user.id) {
      // In-app notification
      await notifyIssueAssigned(
        assigneeId,
        issueId,
        issue.title,
        issue.projectId,
        session.user.name || "Someone"
      );

      // Email notification
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { email: true },
      });
      const project = await prisma.project.findUnique({
        where: { id: issue.projectId },
        select: { name: true },
      });
      if (assignee?.email) {
        const issueUrl = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/projects/${issue.projectId}/issues/${issueId}`;
        await sendIssueAssignedEmail(
          assignee.email,
          session.user.name || "Someone",
          issue.title,
          project?.name || "a project",
          issueUrl
        );
      }
    }

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
  const statusInput = formData.get("status") as string;
  const positionStr = formData.get("position") as string | null;
  const position = positionStr ? parseInt(positionStr, 10) : null;

  // Check if it's a built-in status or custom status
  const validStatuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];
  const isBuiltInStatus = validStatuses.includes(statusInput);
  
  const status = isBuiltInStatus ? (statusInput as IssueStatus) : null;
  const customStatusId = isBuiltInStatus ? null : statusInput;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: { project: { select: { teamId: true, id: true } } },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  // Validate custom status if provided
  if (customStatusId) {
    const customStatus = await prisma.customStatus.findUnique({
      where: { id: customStatusId },
    });
    if (!customStatus || customStatus.projectId !== issue.projectId) {
      return { success: false, error: "Invalid custom status" };
    }
  }

  try {
    const oldStatus = issue.customStatusId || issue.status;
    const newStatus = customStatusId || status;
    const statusChanged = oldStatus !== newStatus;

    // Determine what to query for position updates
    const statusCondition = customStatusId 
      ? { customStatusId: customStatusId }
      : { status: status!, customStatusId: null };

    // FR-052: Handle position updates for reordering within same column
    if (position !== null) {
      // Get all issues in the target status column
      const targetColumnIssues = await prisma.issue.findMany({
        where: {
          projectId: issue.project.id,
          deletedAt: null,
          ...statusCondition,
          id: { not: issueId },
        },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });

      // Reorder issues in the target column
      const updates = targetColumnIssues.map((i, idx) => {
        const newPos = idx >= position ? idx + 1 : idx;
        return prisma.issue.update({
          where: { id: i.id },
          data: { position: newPos },
        });
      });

      // Update the moved issue with status and position
      await prisma.$transaction([
        ...updates,
        prisma.issue.update({
          where: { id: issueId },
          data: {
            status: status || "BACKLOG",
            customStatusId: customStatusId,
            position,
          },
        }),
      ]);
    } else {
      // Just update status without position change
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: status || "BACKLOG",
          customStatusId: customStatusId,
        },
      });
    }

    if (statusChanged) {
      await logIssueChange(issueId, session.user.id, "status", String(oldStatus), String(newStatus));
    }

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
  const labelIdsRaw = formData.get("labelIds") as string | null;
  const labelIds = labelIdsRaw ? labelIdsRaw.split(",").filter(Boolean) : [];

  const issue = await prisma.issue.findUnique({
    where: { id: issueId, deletedAt: null },
    include: {
      project: { select: { teamId: true } },
      labels: {
        include: { label: { select: { name: true } } },
      },
    },
  });

  if (!issue) {
    return { success: false, error: "Issue not found" };
  }

  if (!(await isTeamMember(session.user.id, issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    const oldLabels = issue.labels.map((l) => l.label.name).join(", ");

    // Delete existing labels and create new ones
    await prisma.issueLabel.deleteMany({
      where: { issueId },
    });

    if (labelIds.length > 0) {
      await prisma.issueLabel.createMany({
        data: labelIds.map((labelId) => ({
          issueId,
          labelId,
        })),
      });
    }

    // Get new label names
    const newLabels = await prisma.label.findMany({
      where: { id: { in: labelIds } },
      select: { name: true },
    });
    const newLabelsStr = newLabels.map((l) => l.name).join(", ");

    await logIssueChange(
      issueId,
      session.user.id,
      "labels",
      oldLabels || null,
      newLabelsStr || null
    );

    revalidatePath(`/projects/${issue.projectId}`);
    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true };
  } catch (error) {
    console.error("Update labels error:", error);
    return { success: false, error: "Failed to update labels" };
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
      await logIssueChange(
        issueId,
        session.user.id,
        "status",
        oldStatus,
        newStatus
      );
    }

    revalidatePath(`/projects/${issue.projectId}`);

    return { success: true };
  } catch (error) {
    console.error("Update position error:", error);
    return { success: false, error: "Failed to update issue position" };
  }
}
