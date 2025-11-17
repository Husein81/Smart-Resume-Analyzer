import { isAuthenticated } from "@/lib/middleware";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import { PaginationResponse, querySchema, Resume } from "@/types/schemas";
import { z } from "zod";
import { uploadCVToSupabase } from "@/lib/supabase";
import { parseDocument } from "@/utils/parser";

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

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX are allowed" },
        { status: 400 }
      );
    }

    // Upload to Supabase
    const { url: fileUrl, path: filePath } = await uploadCVToSupabase(
      file,
      userId
    );

    const parsedText = await parseDocument(file);

    // Create resume record in database
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.name,
        fileUrl,
        filePath,
        fileSize: file.size,
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

    // Validate userId is a proper MongoDB ObjectId (24 hex characters)
    if (
      !userId ||
      typeof userId !== "string" ||
      !/^[a-f\d]{24}$/i.test(userId)
    ) {
      console.error("Invalid userId format:", userId);
      return NextResponse.json(
        { error: "Invalid user session. Please sign out and sign back in." },
        { status: 401 }
      );
    }

    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = querySchema.parse({
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
    const response: PaginationResponse<Resume> = {
      data: resumes,
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
