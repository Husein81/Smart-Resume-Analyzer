import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";

/**
 * GET /api/matches/[id]
 * Get a specific match result by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const match = await prisma.matchResult.findFirst({
      where: {
        id,
        resume: {
          userId: authSession.user.id,
        },
      },
      include: {
        resume: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            analysis: true,
          },
        },
        jobDescription: {
          select: {
            id: true,
            title: true,
            description: true,
            skills: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        match,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/matches/[id]
 * Delete a match result
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if match exists and belongs to user's resume
    const existingMatch = await prisma.matchResult.findFirst({
      where: {
        id,
        resume: {
          userId: authSession.user.id,
        },
      },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Delete match
    await prisma.matchResult.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Match deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 }
    );
  }
}
