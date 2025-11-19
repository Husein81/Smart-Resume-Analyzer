import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/middleware";
import { deleteCVFromSupabase } from "@/lib/supabase";

/**
 * GET /api/resumes/[id]
 * Get a specific resume by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = authSession.user.id;

    // Fetch resume
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        analysis: true,
        matchResults: {
          include: {
            jobDescription: true,
          },
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Check ownership
    if (resume.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resumes/[id]
 * Delete a resume
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (authSession.user.plan !== "PREMIUM") {
      return NextResponse.json(
        { error: "Premium plan required" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = authSession.user.id;

    // Check if resume exists and user owns it
    const existingResume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!existingResume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (existingResume.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete physical file
    try {
      await deleteCVFromSupabase(existingResume.filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }

    // Delete associated records first (cascade delete)
    await prisma.$transaction([
      // Delete match results
      prisma.matchResult.deleteMany({
        where: { resumeId: id },
      }),
      // Delete analysis
      prisma.analysis.deleteMany({
        where: { resumeId: id },
      }),
      // Delete resume
      prisma.resume.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
