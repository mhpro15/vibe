"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { IssueActionResult, isTeamMember, logIssueChange } from "./helpers";

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

    await logIssueChange(
      issueId,
      session.user.id,
      "comment_added",
      null,
      comment.id
    );

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
    include: {
      issue: { include: { project: { select: { teamId: true, id: true } } } },
    },
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

    revalidatePath(
      `/projects/${comment.issue.project.id}/issues/${comment.issueId}`
    );

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
    include: {
      issue: { include: { project: { select: { teamId: true, id: true } } } },
    },
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

    revalidatePath(
      `/projects/${comment.issue.project.id}/issues/${comment.issueId}`
    );

    return { success: true };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "Failed to delete comment" };
  }
}
