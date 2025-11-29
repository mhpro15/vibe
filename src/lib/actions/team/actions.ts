"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import { TeamActionResult, hasAdminPrivileges, isTeamOwner } from "./helpers";

// FR-010: Create Team
export async function createTeamAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to create a team" };
  }

  const name = formData.get("name") as string;

  if (!name || name.length < 1 || name.length > 50) {
    return {
      success: false,
      error: "Team name must be between 1 and 50 characters",
    };
  }

  try {
    const team = await prisma.team.create({
      data: {
        name,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Log activity
    await prisma.teamActivityLog.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        action: "TEAM_CREATED",
        details: { teamName: name },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/teams");
    return { success: true, data: { teamId: team.id } };
  } catch (error) {
    console.error("Create team error:", error);
    return { success: false, error: "Failed to create team" };
  }
}

// FR-011: Update Team
export async function updateTeamAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;

  if (!teamId) {
    return { success: false, error: "Team ID is required" };
  }

  if (!name || name.length < 1 || name.length > 50) {
    return {
      success: false,
      error: "Team name must be between 1 and 50 characters",
    };
  }

  try {
    // Check permission (OWNER or ADMIN)
    if (!(await hasAdminPrivileges(session.user.id, teamId))) {
      return {
        success: false,
        error: "You don't have permission to update this team",
      };
    }

    const oldTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    await prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    // Log activity
    await prisma.teamActivityLog.create({
      data: {
        teamId,
        userId: session.user.id,
        action: "TEAM_UPDATED",
        details: { oldName: oldTeam?.name, newName: name },
      },
    });

    revalidatePath(`/teams/${teamId}`);
    revalidatePath("/teams");
    return { success: true };
  } catch (error) {
    console.error("Update team error:", error);
    return { success: false, error: "Failed to update team" };
  }
}

// FR-012: Delete Team (Soft delete)
export async function deleteTeamAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;

  if (!teamId) {
    return { success: false, error: "Team ID is required" };
  }

  try {
    // Check permission (OWNER only)
    if (!(await isTeamOwner(session.user.id, teamId))) {
      return {
        success: false,
        error: "Only the team owner can delete the team",
      };
    }

    // Soft delete team and related projects
    await prisma.$transaction([
      prisma.team.update({
        where: { id: teamId },
        data: { deletedAt: new Date() },
      }),
      prisma.project.updateMany({
        where: { teamId },
        data: { deletedAt: new Date() },
      }),
    ]);

    revalidatePath("/teams");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete team error:", error);
    return { success: false, error: "Failed to delete team" };
  }
}

// FR-016: Leave Team
export async function leaveTeamAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;

  if (!teamId) {
    return { success: false, error: "Team ID is required" };
  }

  try {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member) {
      return { success: false, error: "You are not a member of this team" };
    }

    if (member.role === "OWNER") {
      return {
        success: false,
        error:
          "Owner cannot leave the team. Transfer ownership first or delete the team.",
      };
    }

    await prisma.$transaction([
      prisma.teamMember.delete({
        where: { id: member.id },
      }),
      prisma.teamActivityLog.create({
        data: {
          teamId,
          userId: session.user.id,
          action: "MEMBER_LEFT",
        },
      }),
    ]);

    revalidatePath("/teams");
    return { success: true };
  } catch (error) {
    console.error("Leave team error:", error);
    return { success: false, error: "Failed to leave team" };
  }
}

// Legacy action wrapper for backward compatibility
export async function getUserTeamsAction(
  _prevState: TeamActionResult,
  _formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in", teams: [] };
  }

  try {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            owner: {
              select: { name: true, image: true },
            },
            _count: {
              select: {
                members: true,
                projects: { where: { deletedAt: null } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const teams = memberships
      .filter((m) => m.team.deletedAt === null)
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        memberCount: m.team._count.members,
        projectCount: m.team._count.projects,
        role: m.role,
        owner: {
          name: m.team.owner.name,
          image: m.team.owner.image,
        },
      }));

    return { success: true, teams };
  } catch (error) {
    console.error("Get user teams error:", error);
    return { success: false, error: "Failed to get teams", teams: [] };
  }
}
