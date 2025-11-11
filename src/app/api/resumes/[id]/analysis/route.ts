import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";

/**
 * DELETE /api/resumes/[id]/analysis
 * Delete the analysis for a specific resume
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

    // Check if resume exists and belongs to user
    const resume = await prisma.resume.findFirst({
      where: {
        id,
        userId: authSession.user.id,
      },
      include: {
        analysis: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (!resume.analysis) {
      return NextResponse.json(
        { error: "No analysis found for this resume" },
        { status: 404 }
      );
    }

    // Delete analysis
    await prisma.analysis.delete({
      where: {
        id: resume.analysis.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Analysis deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resumes/[id]/analysis
 * Get the analysis for a specific resume
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

    // Check if resume exists and belongs to user
    const analysis = await prisma.analysis.findFirst({
      where: {
        resumeId: id,
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
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        analysis,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    );
  }
}
