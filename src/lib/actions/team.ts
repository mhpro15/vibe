"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";

export type TeamActionResult = {
  success: boolean;
  error?: string;
  data?: unknown;
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
    return { success: false, error: "Team name must be between 1 and 50 characters" };
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
    return { success: false, error: "Team name must be between 1 and 50 characters" };
  }

  try {
    // Check permission (OWNER or ADMIN)
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      return { success: false, error: "You don't have permission to update this team" };
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { name },
    });

    // Log activity
    await prisma.teamActivity.create({
      data: {
        teamId,
        userId: session.user.id,
        action: "TEAM_UPDATED",
        details: { name },
      },
    });

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Update team error:", error);
    return { success: false, error: "Failed to update team" };
  }
}

// FR-012: Delete Team
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
    // Check if user is OWNER
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!member || member.role !== "OWNER") {
      return { success: false, error: "Only the team owner can delete the team" };
    }

    // Soft delete the team and all related data
    const now = new Date();
    
    await prisma.$transaction([
      // Soft delete all comments in team's projects
      prisma.comment.updateMany({
        where: { issue: { project: { teamId } } },
        data: { deletedAt: now },
      }),
      // Soft delete all issues in team's projects
      prisma.issue.updateMany({
        where: { project: { teamId } },
        data: { deletedAt: now },
      }),
      // Soft delete all projects
      prisma.project.updateMany({
        where: { teamId },
        data: { deletedAt: now },
      }),
      // Soft delete the team
      prisma.team.update({
        where: { id: teamId },
        data: { deletedAt: now },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/teams");
    return { success: true };
  } catch (error) {
    console.error("Delete team error:", error);
    return { success: false, error: "Failed to delete team" };
  }
}

// FR-013: Invite Member
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

  if (!teamId || !email) {
    return { success: false, error: "Team ID and email are required" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
      return { success: false, error: "You don't have permission to invite members" };
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

    // Check for existing pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email,
        status: "PENDING",
      },
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (existingInvite) {
      // Update expiration date
      await prisma.teamInvite.update({
        where: { id: existingInvite.id },
        data: { expiresAt },
      });
    } else {
      // Create new invite
      await prisma.teamInvite.create({
        data: {
          teamId,
          email,
          invitedBy: session.user.id,
          expiresAt,
        },
      });
    }

    // Send invitation email
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (process.env.RESEND_API_KEY && team) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
            to: email,
            subject: `You've been invited to join ${team.name} on Jira Lite`,
            html: `
              <h1>Team Invitation</h1>
              <p>You've been invited to join the team <strong>${team.name}</strong> on Jira Lite.</p>
              <p>Click the link below to accept the invitation:</p>
              <a href="${baseUrl}/invites" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">View Invitation</a>
              <p>This invitation will expire in 7 days.</p>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
      }
    }

    revalidatePath(`/teams/${teamId}/members`);
    return { success: true };
  } catch (error) {
    console.error("Invite member error:", error);
    return { success: false, error: "Failed to send invitation" };
  }
}

// Accept team invite
export async function acceptInviteAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" };
  }

  const inviteId = formData.get("inviteId") as string;

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
      return { success: false, error: "This invitation has already been processed" };
    }

    if (invite.expiresAt < new Date()) {
      return { success: false, error: "This invitation has expired" };
    }

    // Add user to team
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: session.user.id,
          role: "MEMBER",
        },
      }),
      prisma.teamInvite.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      }),
      prisma.teamActivity.create({
        data: {
          teamId: invite.teamId,
          userId: session.user.id,
          action: "MEMBER_JOINED",
          details: { memberName: session.user.name },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/invites");
    revalidatePath(`/teams/${invite.teamId}`);
    return { success: true, data: { teamId: invite.teamId } };
  } catch (error) {
    console.error("Accept invite error:", error);
    return { success: false, error: "Failed to accept invitation" };
  }
}

// FR-015: Kick Member
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
    return { success: false, error: "Team ID and member ID are required" };
  }

  try {
    // Check current user's permission
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
      return { success: false, error: "You don't have permission to kick members" };
    }

    // Get target member
    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: memberId },
      },
      include: { user: true },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Cannot kick yourself
    if (memberId === session.user.id) {
      return { success: false, error: "You cannot kick yourself" };
    }

    // ADMIN can only kick MEMBER
    if (currentMember.role === "ADMIN" && targetMember.role !== "MEMBER") {
      return { success: false, error: "Admins can only kick regular members" };
    }

    // Cannot kick OWNER
    if (targetMember.role === "OWNER") {
      return { success: false, error: "Cannot kick the team owner" };
    }

    await prisma.$transaction([
      prisma.teamMember.delete({
        where: {
          teamId_userId: { teamId, userId: memberId },
        },
      }),
      prisma.teamActivity.create({
        data: {
          teamId,
          userId: session.user.id,
          action: "MEMBER_KICKED",
          targetUserId: memberId,
          details: { memberName: targetMember.user.name },
        },
      }),
    ]);

    revalidatePath(`/teams/${teamId}/members`);
    return { success: true };
  } catch (error) {
    console.error("Kick member error:", error);
    return { success: false, error: "Failed to kick member" };
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
      return { success: false, error: "Team owner cannot leave. Transfer ownership or delete the team instead." };
    }

    await prisma.$transaction([
      prisma.teamMember.delete({
        where: {
          teamId_userId: { teamId, userId: session.user.id },
        },
      }),
      prisma.teamActivity.create({
        data: {
          teamId,
          userId: session.user.id,
          action: "MEMBER_LEFT",
          details: { memberName: session.user.name },
        },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Leave team error:", error);
    return { success: false, error: "Failed to leave team" };
  }
}

// FR-018: Change Role
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
  const newRole = formData.get("role") as "ADMIN" | "MEMBER" | "OWNER";

  if (!teamId || !memberId || !newRole) {
    return { success: false, error: "Team ID, member ID, and role are required" };
  }

  if (!["OWNER", "ADMIN", "MEMBER"].includes(newRole)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    // Only OWNER can change roles
    const currentMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: session.user.id },
      },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return { success: false, error: "Only the team owner can change roles" };
    }

    const targetMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId: memberId },
      },
      include: { user: true },
    });

    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Transferring ownership
    if (newRole === "OWNER") {
      await prisma.$transaction([
        // Demote current owner to ADMIN
        prisma.teamMember.update({
          where: {
            teamId_userId: { teamId, userId: session.user.id },
          },
          data: { role: "ADMIN" },
        }),
        // Promote target to OWNER
        prisma.teamMember.update({
          where: {
            teamId_userId: { teamId, userId: memberId },
          },
          data: { role: "OWNER" },
        }),
        // Update team ownerId
        prisma.team.update({
          where: { id: teamId },
          data: { ownerId: memberId },
        }),
        prisma.teamActivity.create({
          data: {
            teamId,
            userId: session.user.id,
            action: "OWNERSHIP_TRANSFERRED",
            targetUserId: memberId,
            details: { newOwnerName: targetMember.user.name },
          },
        }),
      ]);
    } else {
      // Regular role change
      const oldRole = targetMember.role;
      
      await prisma.$transaction([
        prisma.teamMember.update({
          where: {
            teamId_userId: { teamId, userId: memberId },
          },
          data: { role: newRole },
        }),
        prisma.teamActivity.create({
          data: {
            teamId,
            userId: session.user.id,
            action: "ROLE_CHANGED",
            targetUserId: memberId,
            details: { 
              memberName: targetMember.user.name,
              oldRole,
              newRole,
            },
          },
        }),
      ]);
    }

    revalidatePath(`/teams/${teamId}/members`);
    return { success: true };
  } catch (error) {
    console.error("Change role error:", error);
    return { success: false, error: "Failed to change role" };
  }
}

// Get user's teams
export async function getMyTeams() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const teams = await prisma.team.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        _count: {
          select: { members: true, projects: true },
        },
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return teams.map((team) => ({
      ...team,
      myRole: team.members[0]?.role || "MEMBER",
    }));
  } catch (error) {
    console.error("Get teams error:", error);
    return [];
  }
}

// Get team by ID
export async function getTeam(teamId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        deletedAt: null,
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    });

    return team;
  } catch (error) {
    console.error("Get team error:", error);
    return null;
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
      prisma.teamActivity.findMany({
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
      prisma.teamActivity.count({
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
        inviter: {
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
