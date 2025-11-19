import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { z } from "zod";

// Schema for job description update
const JobDescriptionUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  skills: z.array(z.string()).min(1).optional(),
});

/**
 * GET /api/jobs/[id]
 * Get a specific job description by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await prisma.jobDescription.findFirst({
      where: {
        id,
        userId: authSession.user.id,
      },
      include: {
        matchResults: {
          include: {
            resume: {
              select: {
                id: true,
                fileName: true,
                fileUrl: true,
              },
            },
          },
          orderBy: {
            matchScore: "desc",
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        job,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job description" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update a job description
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate input
    const validatedData = JobDescriptionUpdateSchema.parse(body);

    // Check if job exists and belongs to user
    const existingJob = await prisma.jobDescription.findFirst({
      where: {
        id,
        userId: authSession.user.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    // Update job
    const job = await prisma.jobDescription.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(
      {
        success: true,
        job,
        message: "Job description updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating job:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update job description" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job description and all associated matches
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
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

    // Check if job exists and belongs to user
    const existingJob = await prisma.jobDescription.findFirst({
      where: {
        id,
        userId: authSession.user.id,
      },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job description not found" },
        { status: 404 }
      );
    }

    // Delete job (cascade will delete match results)
    await prisma.$transaction(async (tsx) => {
      await tsx.matchResult.deleteMany({
        where: { jobDescriptionId: id },
      });
      await tsx.jobDescription.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Job description deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job description" },
      { status: 500 }
    );
  }
}
