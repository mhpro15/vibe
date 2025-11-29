"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export type TeamActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
  teams?: Array<{
    id: string;
    name: string;
    memberCount: number;
    projectCount: number;
    role: "OWNER" | "ADMIN" | "MEMBER";
    owner: {
      name: string;
      image?: string | null;
    };
  }>;
};

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
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
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
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member || member.role !== "OWNER") {
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

// FR-013: Invite Team Member
export async function inviteMemberAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;
  const email = formData.get("email") as string;
  const role = (formData.get("role") as "ADMIN" | "MEMBER") || "MEMBER";

  if (!teamId) {
    return { success: false, error: "Team ID is required" };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  try {
    // Check permission (OWNER or ADMIN)
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return {
        success: false,
        error: "You don't have permission to invite members",
      };
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId, userId: existingUser.id },
        },
      });

      if (existingMember) {
        return { success: false, error: "This user is already a team member" };
      }
    }

    // Check for pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return {
        success: false,
        error: "An invitation has already been sent to this email",
      };
    }

    // Create invite (expires in 7 days)
    await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        senderId: session.user.id,
        recipientId: existingUser?.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Log activity
    await prisma.teamActivityLog.create({
      data: {
        teamId,
        userId: session.user.id,
        action: "MEMBER_INVITED",
        details: { invitedEmail: email, role },
      },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Invite member error:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}

// FR-014: Accept/Decline Invite
export async function respondToInviteAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id || !session?.user?.email) {
    return { success: false, error: "You must be logged in" };
  }

  const inviteId = formData.get("inviteId") as string;
  const response = formData.get("response") as "accept" | "decline";

  if (!inviteId) {
    return { success: false, error: "Invite ID is required" };
  }

  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
      include: { team: true },
    });

    if (!invite) {
      return { success: false, error: "Invitation not found" };
    }

    if (invite.email !== session.user.email) {
      return { success: false, error: "This invitation is not for you" };
    }

    if (invite.status !== "PENDING") {
      return {
        success: false,
        error: "This invitation has already been processed",
      };
    }

    if (invite.expiresAt < new Date()) {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "EXPIRED" },
      });
      return { success: false, error: "This invitation has expired" };
    }

    if (response === "accept") {
      await prisma.$transaction([
        prisma.teamInvite.update({
          where: { id: inviteId },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            recipientId: session.user.id,
          },
        }),
        prisma.teamMember.create({
          data: {
            teamId: invite.teamId,
            userId: session.user.id,
            role: invite.role,
          },
        }),
        prisma.teamActivityLog.create({
          data: {
            teamId: invite.teamId,
            userId: session.user.id,
            action: "MEMBER_JOINED",
            details: { role: invite.role },
          },
        }),
      ]);
    } else {
      await prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "DECLINED" },
      });
    }

    revalidatePath("/teams");
    revalidatePath(`/teams/${invite.teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Respond to invite error:", error);
    return { success: false, error: "Failed to process invitation" };
  }
}

// FR-015: Kick Team Member
export async function kickMemberAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;
  const memberId = formData.get("memberId") as string;

  if (!teamId || !memberId) {
    return { success: false, error: "Team ID and Member ID are required" };
  }

  try {
    // Get current user's role
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
      return {
        success: false,
        error: "You don't have permission to remove members",
      };
    }

    // Get target member
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return { success: false, error: "Member not found" };
    }

    // Can't kick owner
    if (targetMember.role === "OWNER") {
      return { success: false, error: "Cannot remove the team owner" };
    }

    // Admin can only kick members, not other admins
    if (currentMember.role === "ADMIN" && targetMember.role === "ADMIN") {
      return { success: false, error: "Admins cannot remove other admins" };
    }

    await prisma.$transaction([
      prisma.teamMember.delete({
        where: { id: memberId },
      }),
      prisma.teamActivityLog.create({
        data: {
          teamId,
          userId: session.user.id,
          action: "MEMBER_REMOVED",
          targetUserId: targetMember.userId,
          details: { memberName: targetMember.user.name },
        },
      }),
    ]);

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Kick member error:", error);
    return { success: false, error: "Failed to remove member" };
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

// FR-017: Change Member Role
export async function changeRoleAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const teamId = formData.get("teamId") as string;
  const memberId = formData.get("memberId") as string;
  const newRole = formData.get("newRole") as "OWNER" | "ADMIN" | "MEMBER";

  if (!teamId || !memberId || !newRole) {
    return { success: false, error: "Missing required fields" };
  }

  if (!["OWNER", "ADMIN", "MEMBER"].includes(newRole)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    // Get current user's role
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return {
        success: false,
        error: "Only the team owner can change roles",
      };
    }

    // Get target member
    const targetMember = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!targetMember || targetMember.teamId !== teamId) {
      return { success: false, error: "Member not found" };
    }

    const oldRole = targetMember.role;

    // Handle ownership transfer
    if (newRole === "OWNER") {
      await prisma.$transaction([
        // Demote current owner to admin
        prisma.teamMember.update({
          where: { id: currentMember.id },
          data: { role: "ADMIN" },
        }),
        // Promote target to owner
        prisma.teamMember.update({
          where: { id: memberId },
          data: { role: "OWNER" },
        }),
        // Update team owner
        prisma.team.update({
          where: { id: teamId },
          data: { ownerId: targetMember.userId },
        }),
        // Log activity
        prisma.teamActivityLog.create({
          data: {
            teamId,
            userId: session.user.id,
            action: "OWNERSHIP_TRANSFERRED",
            targetUserId: targetMember.userId,
            details: { newOwnerName: targetMember.user.name },
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.teamMember.update({
          where: { id: memberId },
          data: { role: newRole },
        }),
        prisma.teamActivityLog.create({
          data: {
            teamId,
            userId: session.user.id,
            action: "ROLE_CHANGED",
            targetUserId: targetMember.userId,
            details: {
              memberName: targetMember.user.name,
              oldRole,
              newRole,
            },
          },
        }),
      ]);
    }

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Change role error:", error);
    return { success: false, error: "Failed to change role" };
  }
}

// FR-018: Get User's Teams
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

// FR-019: Get Team Activity Log
export async function getTeamActivityLog(teamId: string, page = 1, limit = 20) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { activities: [], total: 0 };
  }

  try {
    // Verify membership
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member) {
      return { activities: [], total: 0 };
    }

    const [activities, total] = await Promise.all([
      prisma.teamActivityLog.findMany({
        where: { teamId },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          targetUser: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teamActivityLog.count({
        where: { teamId },
      }),
    ]);

    return { activities, total };
  } catch (error) {
    console.error("Get activity log error:", error);
    return { activities: [], total: 0 };
  }
}

// Get pending invites for current user
export async function getMyInvites() {
  const session = await getSession();
  if (!session?.user?.email) {
    return [];
  }

  try {
    const invites = await prisma.teamInvite.findMany({
      where: {
        email: session.user.email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        sender: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invites;
  } catch (error) {
    console.error("Get invites error:", error);
    return [];
  }
}
