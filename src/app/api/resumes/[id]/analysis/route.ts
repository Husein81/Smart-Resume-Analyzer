import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { groq } from "@/lib/groq";

/** POST /api/resumes/[id]/analysis
 * Analyze a specific resume
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Check if already has analysis
    if (resume.analysis) {
      return NextResponse.json(
        { error: "Resume already analyzed. Delete existing analysis first." },
        { status: 400 }
      );
    }

    if (!resume.parsedText) {
      return NextResponse.json(
        { error: "No resume text to analyze. Please re-upload the file." },
        { status: 400 }
      );
    }

    // Optional: Get job description for better analysis
    const body = await request.json().catch(() => ({}));
    const jobDescription = body.jobDescription || "";

    const prompt = `You are an expert ATS (Applicant Tracking System), resume analyst, and career assessment engine.

        Your task is to evaluate the candidate’s resume with professional precision and return a structured JSON assessment.

        Use the job description context if provided, otherwise evaluate the resume independently.

        -------------------------
        JOB CONTEXT (optional):
        ${jobDescription ?? "None provided"}

        -------------------------
        RESUME CONTENT:
        ${resume.parsedText}

        -------------------------
        ANALYSIS REQUIREMENTS:

        Return ONLY a valid JSON object (no markdown, no explanations, no text before or after) with the following exact fields:

        {
          "summary": "A concise 2–3 sentence professional summary describing the candidate’s overall profile",
          "skills": ["list of extracted hard and soft skills"],
          "experience": ["role at company (duration)", "quantified achievements if found"],
          "education": ["degrees, institutions, certifications"],
          "score": 0
        }

        SCORING GUIDELINES (0–100):
        - Resume completeness, structure, clarity (30%)
        - Skills relevance, strength, and depth (25%)
        - Experience quality, impact, metrics, achievements (25%)
        - Education and certifications relevance/strength (10%)
        - ATS compatibility (formatting, scannability, keyword match) (10%)

        INTERPRET SCORE STRICTLY:
        - 0–59 = Poor
        - 60–69 = Average
        - 70–79 = Good
        - 80–89 = Excellent
        - 90–100 = Exceptional

        IMPORTANT RULES:
        - Do NOT add fields not listed.
        - Do NOT output anything except valid JSON.
        - Fill missing information realistically but avoid inventing achievements or details not supported by the resume.
        - If information is missing in the resume, include "N/A" in the relevant fields (not empty).
        `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a professional resume analyzer. Always respond with valid JSON only, no additional text.",
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

    // Parse and validate with Zod
    const analysisData = JSON.parse(cleanedText);

    // Validate the structure
    if (!analysisData.summary || !analysisData.skills || !analysisData.score) {
      throw new Error("Invalid analysis structure from AI");
    }

    // Create analysis in database
    const analysis = await prisma.analysis.create({
      data: {
        summary: analysisData.summary,
        skills: analysisData.skills || [],
        experience: analysisData.experience || [],
        education: analysisData.education || [],
        score: Math.min(100, Math.max(0, analysisData.score)), // Clamp between 0-100
        aiModel: "llama-3.3-70b-versatile",
        resume: {
          connect: { id },
        },
      },
    });

    return NextResponse.json(
      {
        analysis,
        message: "Resume analyzed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error analyzing resume:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze resume",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resumes/[id]/analysis
 * Delete the analysis for a specific resume
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

    const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const authSession = await isAuthenticated();
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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
