import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { z } from "zod";

// Schema for job description creation
const JobDescriptionCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

// Schema for query parameters
const JobQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * POST /api/jobs
 * Create a new job description
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    const validatedData = JobDescriptionCreateSchema.parse(body);

    const job = await prisma.jobDescription.create({
      data: {
        userId: authSession.user.id,
        title: validatedData.title,
        description: validatedData.description,
        skills: validatedData.skills,
      },
    });

    return NextResponse.json(
      {
        success: true,
        job,
        message: "Job description created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating job:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create job description" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs
 * Get all job descriptions for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = JobQuerySchema.parse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    // Fetch jobs with match results count
    const [jobs, total] = await Promise.all([
      prisma.jobDescription.findMany({
        where: {
          userId: authSession.user.id,
        },
        include: {
          matchResults: {
            select: {
              id: true,
              matchScore: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.jobDescription.count({
        where: {
          userId: authSession.user.id,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        jobs,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch job descriptions" },
      { status: 500 }
    );
  }
}
