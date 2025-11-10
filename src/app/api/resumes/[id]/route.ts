import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/middleware";
import { deleteFile } from "@/lib/fileHandler";
import { ResumeUpdateRequestSchema, ErrorResponseSchema } from "@/types/resume";
import { z } from "zod";

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

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/resumes/[id]
 * Update a resume
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await isAuthenticated();

    if (!authSession) {
      const errorResponse = ErrorResponseSchema.parse({
        error: "Unauthorized",
      });
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const { id } = await params;
    const userId = authSession.user.id;

    // Check if resume exists and user owns it
    const existingResume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!existingResume) {
      const errorResponse = ErrorResponseSchema.parse({
        error: "Resume not found",
      });
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (existingResume.userId !== userId) {
      const errorResponse = ErrorResponseSchema.parse({
        error: "Forbidden",
      });
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Get and validate update data
    const body = await request.json();
    const validatedData = ResumeUpdateRequestSchema.parse(body);

    // Update resume
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: {
        ...(validatedData.fileName && { fileName: validatedData.fileName }),
        ...(validatedData.parsedText && {
          parsedText: validatedData.parsedText,
        }),
        updatedAt: new Date(),
      },
      include: {
        analysis: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Resume updated successfully",
      resume: updatedResume,
    });
  } catch (error) {
    console.error("Error updating resume:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      const errorResponse = ErrorResponseSchema.parse({
        error: `Invalid update data: ${
          firstError?.message || "Validation failed"
        }`,
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse = ErrorResponseSchema.parse({
      error: "Failed to update resume",
    });
    return NextResponse.json(errorResponse, { status: 500 });
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

    // Delete physical file
    try {
      await deleteFile(existingResume.fileUrl);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue even if file deletion fails
    }

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
