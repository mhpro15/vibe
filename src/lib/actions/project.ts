"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export type ProjectActionResult = {
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

// Helper to check if user is team admin or owner
async function isTeamAdmin(userId: string, teamId: string) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId,
      },
    },
  });
  return member?.role === "ADMIN" || member?.role === "OWNER";
}

// Helper to check if user is project owner
async function _isProjectOwner(userId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  return project?.ownerId === userId;
}

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

// Data fetching functions
export async function getProjectById(projectId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId, deletedAt: null },
    include: {
      team: {
        select: { id: true, name: true },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
      labels: {
        orderBy: { name: "asc" },
      },
      customStatuses: {
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  // Check if user is a member of the team
  if (!(await isTeamMember(session.user.id, project.teamId))) {
    return null;
  }

  // Check if favorited
  const favorite = await prisma.userFavoriteProject.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId,
      },
    },
  });

  return {
    ...project,
    isFavorite: !!favorite,
  };
}

export async function getTeamProjects(teamId: string, includeArchived = false) {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  // Check team membership
  if (!(await isTeamMember(session.user.id, teamId))) {
    return [];
  }

  const projects = await prisma.project.findMany({
    where: {
      teamId,
      deletedAt: null,
      ...(includeArchived ? {} : { isArchived: false }),
    },
    include: {
      owner: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((p) => ({
    ...p,
    isFavorite: p.favorites.length > 0,
    favorites: undefined,
  }));
}

export async function getUserProjects() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  // Get all teams user is a member of
  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    select: { teamId: true },
  });

  const teamIds = memberships.map((m) => m.teamId);

  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
      deletedAt: null,
      isArchived: false,
    },
    include: {
      team: {
        select: { id: true, name: true },
      },
      owner: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: {
          issues: { where: { deletedAt: null } },
        },
      },
      favorites: {
        where: { userId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return projects.map((p) => ({
    ...p,
    isFavorite: p.favorites.length > 0,
    favorites: undefined,
  }));
}

export async function getFavoriteProjects() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  const favorites = await prisma.userFavoriteProject.findMany({
    where: { userId: session.user.id },
    include: {
      project: {
        include: {
          team: {
            select: { id: true, name: true },
          },
          owner: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: {
              issues: { where: { deletedAt: null } },
            },
          },
        },
      },
    },
  });

  return favorites
    .filter((f) => f.project.deletedAt === null)
    .map((f) => ({
      ...f.project,
      isFavorite: true,
    }));
}
