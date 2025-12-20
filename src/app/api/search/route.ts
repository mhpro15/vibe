import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/actions/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim();
    console.log(`Searching for: "${searchTerm}" for user: ${session.user.id}`);

    // Get user's team memberships to filter results
    const userTeamIds = await prisma.teamMember
      .findMany({
        where: { userId: session.user.id },
        select: { teamId: true },
      })
      .then((memberships) => memberships.map((m) => m.teamId));

    // Search issues (only from user's teams)
    const issues = await prisma.issue.findMany({
      where: {
        deletedAt: null,
        project: {
          deletedAt: null,
          teamId: { in: userTeamIds },
        },
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
      },
      orderBy: [
        { updatedAt: "desc" },
      ],
    });

    // Search projects (only from user's teams)
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        teamId: { in: userTeamIds },
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        { updatedAt: "desc" },
      ],
    });

    // Search teams (only user's teams)
    const teams = await prisma.team.findMany({
      where: {
        deletedAt: null,
        id: { in: userTeamIds },
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        { updatedAt: "desc" },
      ],
    });

    // Combine and format results
    const results = [
      ...issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        type: "issue" as const,
        projectId: issue.projectId,
        status: issue.status,
      })),
      ...projects.map((project) => ({
        id: project.id,
        title: project.name,
        type: "project" as const,
      })),
      ...teams.map((team) => ({
        id: team.id,
        title: team.name,
        type: "team" as const,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
