"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { isTeamMember, isTeamAdmin, ProjectActionResult } from "./helpers";

// FR-020: Create Project
export async function createProjectAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const teamId = formData.get("teamId") as string;

  // Validate name
  if (!name || name.length < 1 || name.length > 100) {
    return {
      success: false,
      error: "Project name must be between 1 and 100 characters",
    };
  }

  // Validate description
  if (description && description.length > 2000) {
    return {
      success: false,
      error: "Description must be less than 2000 characters",
    };
  }

  // Check team membership
  if (!(await isTeamMember(session.user.id, teamId))) {
    return { success: false, error: "You are not a member of this team" };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        teamId,
        ownerId: session.user.id,
      },
    });

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { projectId: project.id },
    };
  } catch (error) {
    console.error("Create project error:", error);
    return { success: false, error: "Failed to create project" };
  }
}

// FR-021: Edit Project
export async function updateProjectAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  // Validate name
  if (!name || name.length < 1 || name.length > 100) {
    return {
      success: false,
      error: "Project name must be between 1 and 100 characters",
    };
  }

  // Validate description
  if (description && description.length > 2000) {
    return {
      success: false,
      error: "Description must be less than 2000 characters",
    };
  }

  // Get project and verify ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { ownerId: true, teamId: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Check if user is project owner or team admin
  const isOwner = project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "You don't have permission to edit this project",
    };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/teams/${project.teamId}`);

    return { success: true };
  } catch (error) {
    console.error("Update project error:", error);
    return { success: false, error: "Failed to update project" };
  }
}

// FR-022: Delete Project (Soft delete)
export async function deleteProjectAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { ownerId: true, teamId: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Check if user is project owner or team admin
  const isOwner = project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "You don't have permission to delete this project",
    };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });

    revalidatePath(`/teams/${project.teamId}`);
    revalidatePath("/projects");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

// FR-026: Archive/Unarchive Project
export async function toggleArchiveProjectAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: { ownerId: true, teamId: true, isArchived: true },
  });

  if (!project) {
    return { success: false, error: "Project not found" };
  }

  // Check if user is project owner or team admin
  const isOwner = project.ownerId === session.user.id;
  const isAdmin = await isTeamAdmin(session.user.id, project.teamId);

  if (!isOwner && !isAdmin) {
    return {
      success: false,
      error: "You don't have permission to archive this project",
    };
  }

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { isArchived: !project.isArchived },
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/teams/${project.teamId}`);

    return { success: true, data: { isArchived: !project.isArchived } };
  } catch (error) {
    console.error("Archive project error:", error);
    return { success: false, error: "Failed to archive/unarchive project" };
  }
}

// FR-025: Favorite/Unfavorite Project
export async function toggleFavoriteProjectAction(
  _prevState: ProjectActionResult,
  formData: FormData
): Promise<ProjectActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Authentication required" };
  }

  const projectId = formData.get("projectId") as string;

  // Check project exists and user is member of the team
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
    // Check if already favorited
    const existingFavorite = await prisma.userFavoriteProject.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.userFavoriteProject.delete({
        where: { id: existingFavorite.id },
      });
      revalidatePath("/projects");
      return { success: true, data: { isFavorite: false } };
    } else {
      await prisma.userFavoriteProject.create({
        data: {
          userId: session.user.id,
          projectId,
        },
      });
      revalidatePath("/projects");
      return { success: true, data: { isFavorite: true } };
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return { success: false, error: "Failed to toggle favorite" };
  }
}
