"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { isTeamMember, isTeamAdmin, ProjectActionResult } from "./helpers";

// FR-023 & FR-024: Manage Labels
export async function createLabelAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  // Validate name
  if (!name || name.length < 1 || name.length > 50) {
    return {
      success: false,
      error: "Label name must be between 1 and 50 characters",
    };
  }

  // Validate color (hex format)
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return {
      success: false,
      error: "Invalid color format. Use hex format (#RRGGBB)",
    };
  }

  // Check project and team membership
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { teamId: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  if (!(await isTeamMember(session.user.id, project.teamId))) {
    return { success: false, error: "You are not a member of this team" };
  }

  try {
    // Check for duplicate label name in project
    const existingLabel = await prisma.label.findFirst({
      where: { projectId, name },
    });

    if (existingLabel) {
      return { success: false, error: "A label with this name already exists" };
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        projectId,
      },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: { labelId: label.id } };
  } catch (error) {
    console.error("Create label error:", error);
    return { success: false, error: "Failed to create label" };
  }
}

export async function updateLabelAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const labelId = formData.get("labelId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  // Validate
  if (!name || name.length < 1 || name.length > 50) {
    return {
      success: false,
      error: "Label name must be between 1 and 50 characters",
    };
  }

  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return {
      success: false,
      error: "Invalid color format. Use hex format (#RRGGBB)",
    };
  }

  // Get label and project
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    include: { project: { select: { teamId: true, id: true } } },
  });

  if (!label) {
    return { success: false, error: "Label not found" };
  }

  if (!(await isTeamMember(session.user.id, label.project.teamId))) {
    return { success: false, error: "You are not a member of this team" };
  }

  try {
    await prisma.label.update({
      where: { id: labelId },
      data: { name, color },
    });

    revalidatePath(`/projects/${label.project.id}`);

    return { success: true };
  } catch (error) {
    console.error("Update label error:", error);
    return { success: false, error: "Failed to update label" };
  }
}

export async function deleteLabelAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const labelId = formData.get("labelId") as string;

  // Get label and project
  const label = await prisma.label.findUnique({
    where: { id: labelId },
    include: { project: { select: { teamId: true, id: true } } },
  });

  if (!label) {
    return { success: false, error: "Label not found" };
  }

  if (!(await isTeamMember(session.user.id, label.project.teamId))) {
    return { success: false, error: "You are not a member of this team" };
  }

  try {
    await prisma.label.delete({
      where: { id: labelId },
    });

    revalidatePath(`/projects/${label.project.id}`);

    return { success: true };
  } catch (error) {
    console.error("Delete label error:", error);
    return { success: false, error: "Failed to delete label" };
  }
}

// FR-027: Custom Statuses
export async function createCustomStatusAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  // Validate
  if (!name || name.length < 1 || name.length > 30) {
    return {
      success: false,
      error: "Status name must be between 1 and 30 characters",
    };
  }

  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return {
      success: false,
      error: "Invalid color format. Use hex format (#RRGGBB)",
    };
  }

  // Check project and permissions
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { teamId: true, ownerId: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  const isOwner = project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Only project owner or team admin can manage custom statuses",
    };
  }

  try {
    // Get max position
    const maxPosition = await prisma.customStatus.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const customStatus = await prisma.customStatus.create({
      data: {
        name,
        color,
        projectId,
        position: (maxPosition?.position ?? -1) + 1,
      },
    });

    revalidatePath(`/projects/${projectId}`);

    return { success: true, data: { customStatusId: customStatus.id } };
  } catch (error) {
    console.error("Create custom status error:", error);
    return { success: false, error: "Failed to create custom status" };
  }
}

export async function updateCustomStatusAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const statusId = formData.get("statusId") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  // Validate
  if (!name || name.length < 1 || name.length > 30) {
    return {
      success: false,
      error: "Status name must be between 1 and 30 characters",
    };
  }

  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return {
      success: false,
      error: "Invalid color format. Use hex format (#RRGGBB)",
    };
  }

  // Get status and project
  const status = await prisma.customStatus.findUnique({
    where: { id: statusId },
    include: { project: { select: { teamId: true, ownerId: true, id: true } } },
  });

  if (!status) {
    return { success: false, error: "Custom status not found" };
  }

  const isOwner = status.project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, status.project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Only project owner or team admin can manage custom statuses",
    };
  }

  try {
    await prisma.customStatus.update({
      where: { id: statusId },
      data: { name, color },
    });

    revalidatePath(`/projects/${status.project.id}`);

    return { success: true };
  } catch (error) {
    console.error("Update custom status error:", error);
    return { success: false, error: "Failed to update custom status" };
  }
}

export async function deleteCustomStatusAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const statusId = formData.get("statusId") as string;

  // Get status and project
  const status = await prisma.customStatus.findUnique({
    where: { id: statusId },
    include: { project: { select: { teamId: true, ownerId: true, id: true } } },
  });

  if (!status) {
    return { success: false, error: "Custom status not found" };
  }

  const isOwner = status.project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, status.project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "Only project owner or team admin can manage custom statuses",
    };
  }

  try {
    // Move issues with this custom status to default status
    await prisma.issue.updateMany({
      where: { customStatusId: statusId },
      data: { customStatusId: null, status: "BACKLOG" },
    });

    await prisma.customStatus.delete({
      where: { id: statusId },
    });

    revalidatePath(`/projects/${status.project.id}`);

    return { success: true };
  } catch (error) {
    console.error("Delete custom status error:", error);
    return { success: false, error: "Failed to delete custom status" };
  }
}
