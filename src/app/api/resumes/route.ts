import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/middleware";
import { handleFileUpload } from "@/lib/fileHandler";

import { z } from "zod";

// Query parameters schema
const ResumeQuerySchema = z.object({
  limit: z.coerce.number().int().positive().default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * POST /api/resumes
 * Upload and create a new resume
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = authSession.user.id;

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json("No file provided", { status: 400 });
    }

    // Handle file upload and text extraction
    const { fileUrl, fileName, parsedText } = await handleFileUpload(file);

    // Create resume record in database
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileUrl,
        fileName,
        parsedText,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error("Error uploading resume:", error);

    return NextResponse.json("Failed to upload resume", { status: 500 });
  }
}

/**
 * GET /api/resumes
 * Get all resumes for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();

    if (!authSession) {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const userId = authSession.user.id;

    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = ResumeQuerySchema.parse({
      limit: searchParams.get("limit") || "10",
      offset: searchParams.get("offset") || "0",
    });

    const { limit, offset } = queryParams;

    // Fetch resumes
    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        include: {
          analysis: true,
          _count: {
            select: {
              matchResults: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.resume.count({ where: { userId } }),
    ]);

    // Validate and return response
    const response = {
      success: true,
      resumes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching resumes:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ status: 400 });
    }
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
