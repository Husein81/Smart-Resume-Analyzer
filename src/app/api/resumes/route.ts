import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/middleware";
import { handleFileUpload } from "@/lib/fileHandler";
import {
  ResumeUploadResponseSchema,
  ResumeListResponseSchema,
  ErrorResponseSchema,
} from "@/types/resume";
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
      const errorResponse = ErrorResponseSchema.parse({
        error: "Unauthorized",
      });
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const userId = authSession.user.id;

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      const errorResponse = ErrorResponseSchema.parse({
        error: "No file provided",
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Handle file upload and text extraction
    const { fileUrl, fileName, parsedText, fileSize } = await handleFileUpload(
      file
    );

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

    // Validate and return response
    const response = ResumeUploadResponseSchema.parse({
      success: true,
      message: "Resume uploaded successfully",
      resume: {
        ...resume,
        user: resume.user,
      },
      metadata: {
        fileSize,
        textLength: parsedText.length,
      },
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error uploading resume:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload resume";

    const errorResponse = ErrorResponseSchema.parse({
      error: errorMessage,
    });

    return NextResponse.json(errorResponse, { status: 500 });
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
      const errorResponse = ErrorResponseSchema.parse({
        error: "Unauthorized",
      });
      return NextResponse.json(errorResponse, { status: 401 });
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
    const response = ResumeListResponseSchema.parse({
      success: true,
      resumes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching resumes:", error);

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      const errorResponse = ErrorResponseSchema.parse({
        error: `Invalid query parameters: ${
          firstError?.message || "Validation failed"
        }`,
      });
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const errorResponse = ErrorResponseSchema.parse({
      error: "Failed to fetch resumes",
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
