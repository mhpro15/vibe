"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";
import { checkTeamMembership } from "./helpers";

/**
 * FR-018: Get User's Teams
 */
export async function getUserTeams() {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
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

    return memberships
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
  } catch (error) {
    console.error("Get user teams error:", error);
    return [];
  }
}

/**
 * FR-019: Get Team Activity Log
 */
export async function getTeamActivityLog(teamId: string, page = 1, limit = 20) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { activities: [], total: 0 };
  }

  try {
    // Verify membership
    const member = await checkTeamMembership(session.user.id, teamId);

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

/**
 * Get pending invites for current user
 */
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

/**
 * Get pending invites for a team (for owners/admins to manage)
 */
export async function getTeamPendingInvites(teamId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  try {
    // Verify membership and check if user has admin privileges
    const member = await checkTeamMembership(session.user.id, teamId);
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return [];
    }

    const invites = await prisma.teamInvite.findMany({
      where: {
        teamId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return invites;
  } catch (error) {
    console.error("Get team pending invites error:", error);
    return [];
  }
}

/**
 * Get team by ID with details
 */
export async function getTeamById(teamId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const member = await checkTeamMembership(session.user.id, teamId);
    if (!member) {
      return null;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId, deletedAt: null },
      include: {
        owner: {
          select: { id: true, name: true, image: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: {
          select: {
            projects: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    return {
      ...team,
      currentUserRole: member.role,
    };
  } catch (error) {
    console.error("Get team error:", error);
    return null;
  }
}
