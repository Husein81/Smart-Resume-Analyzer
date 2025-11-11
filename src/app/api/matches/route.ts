import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { z } from "zod";

// Query parameters schema
const MatchQuerySchema = z.object({
  resumeId: z.string().optional(),
  jobId: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  limit: z.coerce.number().int().positive().default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * GET /api/matches
 * Get match results with optional filtering
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
    const query = MatchQuerySchema.parse({
      resumeId: searchParams.get("resumeId"),
      jobId: searchParams.get("jobId"),
      minScore: searchParams.get("minScore"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });

    // Build where clause
    const where: {
      resume: { userId: string };
      resumeId?: string;
      jobDescriptionId?: string;
      matchScore?: { gte: number };
    } = {
      resume: {
        userId: authSession.user.id,
      },
    };

    if (query.resumeId) {
      where.resumeId = query.resumeId;
    }

    if (query.jobId) {
      where.jobDescriptionId = query.jobId;
    }

    if (query.minScore !== undefined) {
      where.matchScore = {
        gte: query.minScore,
      };
    }

    // Fetch matches
    const [matches, total] = await Promise.all([
      prisma.matchResult.findMany({
        where,
        include: {
          resume: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
            },
          },
          jobDescription: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: {
          matchScore: "desc",
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.matchResult.count({ where }),
    ]);

    return NextResponse.json(
      {
        success: true,
        matches,
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
    console.error("Error fetching matches:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
