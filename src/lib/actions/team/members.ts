"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { revalidatePath } from "next/cache";
import {
  TeamActionResult,
  hasAdminPrivileges,
  checkTeamMembership,
} from "./helpers";
import { notifyTeamInvite, notifyRoleChanged } from "@/lib/actions/notification";

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
    if (!(await hasAdminPrivileges(session.user.id, teamId))) {
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
      const existingMember = await checkTeamMembership(existingUser.id, teamId);

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

    // Notify the invited user if they already have an account
    if (existingUser) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        select: { name: true },
      });
      await notifyTeamInvite(
        existingUser.id,
        team?.name || "a team",
        session.user.name || "Someone",
        teamId
      );
    }

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
    const currentMember = await checkTeamMembership(session.user.id, teamId);

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
    const currentMember = await checkTeamMembership(session.user.id, teamId);

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

    // Notify the member about their role change
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });
    await notifyRoleChanged(
      targetMember.userId,
      team?.name || "a team",
      newRole,
      teamId
    );

    revalidatePath(`/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error("Change role error:", error);
    return { success: false, error: "Failed to change role" };
  }
}
