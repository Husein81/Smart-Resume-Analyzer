import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { z } from "zod";
import { groq } from "@/lib/groq";

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

/**
 * POST /api/matches
 * Create a new match analysis
 */

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resumeId, jobId } = await req.json();

    if (!resumeId || !jobId) {
      return NextResponse.json(
        { error: "resumeId and jobId are required" },
        { status: 400 }
      );
    }

    // Fetch resume and job with ownership check
    const [resume, job] = await Promise.all([
      prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: authSession.user.id,
        },
        include: {
          analysis: true,
        },
      }),
      prisma.jobDescription.findFirst({
        where: {
          id: jobId,
          userId: authSession.user.id,
        },
      }),
    ]);

    if (!resume || !job) {
      return NextResponse.json(
        { error: "Resume or job description not found" },
        { status: 404 }
      );
    }

    if (!resume.parsedText) {
      return NextResponse.json(
        { error: "Resume has no text to analyze. Please re-upload." },
        { status: 400 }
      );
    }

    // Check if match already exists
    const existingMatch = await prisma.matchResult.findFirst({
      where: {
        resumeId,
        jobDescriptionId: jobId,
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        {
          error: "Match already exists for this resume and job",
          match: existingMatch,
        },
        { status: 400 }
      );
    }

    const prompt = `You are an expert job matching system. Compare the resume with the job description and provide a detailed matching analysis.

      Resume:
      ${resume.parsedText}

      ${
        resume.analysis
          ? `\nResume Analysis:
      - Score: ${resume.analysis.score}/100
      - Skills: ${resume.analysis.skills.join(", ")}
      - Summary: ${resume.analysis.summary}
      `
          : ""
      }

      Job Description:
      Title: ${job.title}
      Description: ${job.description}
      Required Skills: ${job.skills.join(", ")}

      Return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
      {
        "matchScore": 75,
        "missingSkills": ["skill1", "skill2"],
        "suggestedEdits": [
          "Add more details about X experience",
          "Highlight Y achievement more prominently"
        ],
        "aiSummary": "A detailed summary of how well the resume matches the job, what strengths they have, and what gaps exist."
      }

      matchScore should be 0-100 based on:
      - Skills overlap (40%)
      - Experience relevance (30%)
      - Education requirements (15%)
      - Overall fit (15%)`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional job matching analyst. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiText = completion.choices[0]?.message?.content?.trim();

    if (!aiText) {
      throw new Error("Empty response from AI");
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedText = aiText;
    if (aiText.startsWith("```")) {
      cleanedText = aiText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    }

    const matchData = JSON.parse(cleanedText);

    // Validate required fields
    if (typeof matchData.matchScore !== "number") {
      throw new Error("Invalid match data structure from AI");
    }

    // Create match result
    const match = await prisma.matchResult.create({
      data: {
        resumeId,
        jobDescriptionId: jobId,
        matchScore: Math.min(100, Math.max(0, matchData.matchScore)),
        missingSkills: matchData.missingSkills || [],
        suggestedEdits: matchData.suggestedEdits || [],
        aiSummary: matchData.aiSummary || "No summary available",
      },
    });

    return NextResponse.json(
      {
        success: true,
        match,
        message: "Match analysis completed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating match:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create match",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
