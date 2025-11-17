import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { groq } from "@/lib/groq";
import { checkFeatureAccess, incrementUsage } from "@/lib/subscription";
import { Prisma } from "@prisma/client";
import { checkFeatureAccess, incrementUsage } from "@/lib/subscription";

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

    // Check usage limits
    const { canAccess } = await checkFeatureAccess(
      authSession.user.id,
      "analysisPerMonth"
    );

    if (!canAccess) {
      return NextResponse.json(
        {
          error: "Analysis limit reached",
          message:
            "You've reached your monthly analysis limit. Upgrade to Premium for unlimited access.",
          remaining: 0,
        },
        { status: 403 }
      );
    }

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
    const body = (await request.json()) as Prisma.AnalysisCreateInput & {
      jobDescription?: string;
    };
    const jobDescription = body.jobDescription || "";
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career consultant with 15+ years of experience in resume optimization and talent assessment.

      TASK:
      Analyze the provided resume with precision and return a structured JSON assessment. If a job description is provided, evaluate alignment; otherwise, assess the resume's overall strength independently.

      ${
        jobDescription
          ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📋 JOB DESCRIPTION CONTEXT:
      ${jobDescription}
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          : "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ NO JOB DESCRIPTION PROVIDED - General assessment mode\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      }

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      📄 RESUME CONTENT:
      ${resume.parsedText}
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      OUTPUT REQUIREMENTS:
      Return ONLY a valid JSON object. No markdown formatting (no \`\`\`json), no explanatory text before or after, no comments.

      EXACT JSON STRUCTURE:
      {
        "summary": "string",
        "skills": ["string"],
        "experience": ["string"],
        "education": ["string"],
        "score": number
      }

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      FIELD GUIDELINES:
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      1. "summary" (string):
        • Write 2-3 sentences (50-80 words max)
        • Capture candidate's core strengths, years of experience, and key expertise areas
        • Professional tone, third-person perspective
        • Example: "Experienced software engineer with 5+ years in full-stack development. Proven track record in building scalable web applications using React, Node.js, and cloud technologies. Strong problem-solver with expertise in system architecture and agile methodologies."

      2. "skills" (array of strings):
        • Extract ALL technical and soft skills mentioned or strongly implied
        • Include: programming languages, frameworks, tools, certifications, methodologies, soft skills
        • Categorize clearly: "JavaScript", "React.js", "Leadership", "Project Management"
        • Remove duplicates and generic terms like "problem solving" unless specifically emphasized
        • Aim for 10-25 skills depending on resume depth
        • Use "N/A" if genuinely no skills can be extracted

      3. "experience" (array of strings):
        • Format: "Job Title at Company Name (Duration)" on first line, followed by bullet points of key achievements
        • Include quantifiable metrics where available (e.g., "Increased sales by 30%")
        • Focus on impact, not just responsibilities
        • Example: "Senior Developer at Tech Corp (Jan 2020 - Present) • Led team of 5 engineers • Reduced API response time by 40%"
        • If no specific dates, estimate based on context (e.g., "2+ years experience mentioned")
        • Use "N/A" if no work experience found

      4. "education" (array of strings):
        • Format: "Degree, Major - Institution, Year"
        • Include certifications and relevant training
        • Examples: "Bachelor of Science, Computer Science - MIT, 2018", "AWS Certified Solutions Architect, 2022"
        • Use "N/A" if no education information found

      5. "score" (integer 0-100):
        Evaluate holistically using these weighted criteria:

        A. CONTENT QUALITY (40 points)
            • Clarity and organization (10 pts)
            • Quantifiable achievements and impact (15 pts)
            • Relevance to ${
              jobDescription ? "target job" : "career level"
            } (15 pts)

        B. SKILLS & EXPERTISE (25 points)
            • Technical/hard skills depth and relevance (15 pts)
            • Soft skills and leadership indicators (10 pts)

        C. EXPERIENCE STRENGTH (20 points)
            • Years of relevant experience (10 pts)
            • Career progression and growth (10 pts)

        D. CREDENTIALS (10 points)
            • Education level and reputation (5 pts)
            • Certifications and continuous learning (5 pts)

        E. ATS COMPATIBILITY (5 points)
            • Keyword optimization (3 pts)
            • Format scannability (2 pts)

        SCORE INTERPRETATION (be strict and realistic):
        • 90-100: Exceptional - Top 5% candidate, highly competitive
        • 80-89: Excellent - Strong profile, ready for senior positions
        • 70-79: Good - Solid experience, competitive for mid-level roles
        • 60-69: Average - Adequate but needs improvement for competitive edge
        • 50-59: Below Average - Significant gaps or lack of detail
        • 0-49: Poor - Major deficiencies, requires substantial revision

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      CRITICAL RULES:
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ✓ Output MUST be valid, parseable JSON only
      ✓ Use "N/A" for missing data, never leave arrays empty
      ✓ Be objective and realistic - do not inflate scores
      ✓ Base assessment ONLY on information provided in the resume
      ✓ Do not invent achievements, skills, or credentials not present
      ✓ Score strictly according to guidelines - most resumes score 60-80
      ✗ NO markdown code blocks (\`\`\`json)
      ✗ NO explanatory text before or after JSON
      ✗ NO additional fields beyond the 5 specified
      ✗ NO comments inside JSON

      BEGIN ANALYSIS NOW:`;

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

    // Log AI usage
    await incrementUsage(
      authSession.user.id,
      "analysis",
      `analyze resume: ${resume.fileName}`,
      JSON.stringify(analysisData),
      "llama-3.3-70b-versatile",
      completion.usage?.total_tokens
    );

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
