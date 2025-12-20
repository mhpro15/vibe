"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import {
  IssueActionResult,
  isTeamMember,
  logIssueChange,
  logIssueActivity,
} from "./helpers";

// FR-039: Add Subtask
export async function addSubtaskAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const issueId = formData.get("issueId") as string;
  const title = formData.get("title") as string;

  if (!title || title.length < 1 || title.length > 200) {
    return {
      success: false,
      error: "Subtask title must be between 1 and 200 characters",
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
    // Get max position
    const maxPosition = await prisma.subtask.findFirst({
      where: { issueId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        title,
        issueId,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });

    await logIssueChange(
      issueId,
      session.user.id,
      "subtask_added",
      null,
      title
    );
    await logIssueActivity(issueId, session.user.id, "SUBTASK_ADDED", {
      title,
      subtaskId: subtask.id,
    });

    revalidatePath(`/projects/${issue.projectId}/issues/${issueId}`);

    return { success: true, data: { subtaskId: subtask.id } };
  } catch (error) {
    console.error("Add subtask error:", error);
    return { success: false, error: "Failed to add subtask" };
  }
}

// FR-040: Toggle Subtask
export async function toggleSubtaskAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const subtaskId = formData.get("subtaskId") as string;

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: {
      issue: { include: { project: { select: { teamId: true, id: true } } } },
    },
  });

  if (!subtask) {
    return { success: false, error: "Subtask not found" };
  }

  if (!(await isTeamMember(session.user.id, subtask.issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    await prisma.subtask.update({
      where: { id: subtaskId },
      data: { isCompleted: !subtask.isCompleted },
    });

    await logIssueChange(
      subtask.issueId,
      session.user.id,
      "subtask_toggled",
      subtask.isCompleted ? "completed" : "incomplete",
      !subtask.isCompleted ? "completed" : "incomplete"
    );
    await logIssueActivity(subtask.issueId, session.user.id, "SUBTASK_TOGGLED", {
      subtaskId,
      title: subtask.title,
      isCompleted: !subtask.isCompleted,
    });

    revalidatePath(
      `/projects/${subtask.issue.project.id}/issues/${subtask.issueId}`
    );

    return { success: true, data: { isCompleted: !subtask.isCompleted } };
  } catch (error) {
    console.error("Toggle subtask error:", error);
    return { success: false, error: "Failed to toggle subtask" };
  }
}

// FR-041: Delete Subtask
export async function deleteSubtaskAction(
  _prevState: IssueActionResult,
  formData: FormData
): Promise<IssueActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const subtaskId = formData.get("subtaskId") as string;

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: {
      issue: { include: { project: { select: { teamId: true, id: true } } } },
    },
  });

  if (!subtask) {
    return { success: false, error: "Subtask not found" };
  }

  if (!(await isTeamMember(session.user.id, subtask.issue.project.teamId))) {
    return { success: false, error: "You don't have access to this issue" };
  }

  try {
    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    await logIssueChange(
      subtask.issueId,
      session.user.id,
      "subtask_deleted",
      subtask.title,
      null
    );
    await logIssueActivity(subtask.issueId, session.user.id, "SUBTASK_DELETED", {
      title: subtask.title,
    });

    revalidatePath(
      `/projects/${subtask.issue.project.id}/issues/${subtask.issueId}`
    );

    return { success: true };
  } catch (error) {
    console.error("Delete subtask error:", error);
    return { success: false, error: "Failed to delete subtask" };
  }
}

// Get subtasks for an issue
export async function getSubtasks(issueId: string) {
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

  const subtasks = await prisma.subtask.findMany({
    where: { issueId },
    orderBy: { position: "asc" },
  });

  return subtasks;
}
