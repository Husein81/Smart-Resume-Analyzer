import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";
import { z } from "zod";
import { groq } from "@/lib/groq";
import { checkFeatureAccess, incrementUsage } from "@/lib/subscription";

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

    // Check usage limits
    const { canAccess } = await checkFeatureAccess(
      authSession.user.id,
      "matchesPerMonth"
    );

    if (!canAccess) {
      return NextResponse.json(
        {
          error: "Match limit reached",
          message:
            "You've reached your monthly match limit. Upgrade to Premium for unlimited access.",
          remaining: 0,
        },
        { status: 403 }
      );
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

    const prompt = `You are an elite ATS (Applicant Tracking System) and talent acquisition expert with deep expertise in job-candidate matching and resume optimization.
    
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📄 CANDIDATE RESUME:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ${resume.parsedText}

        ${
          resume.analysis
            ? `
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📊 EXISTING RESUME ANALYSIS:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        • Overall Resume Quality Score: ${resume.analysis.score}/100
        • Identified Skills: ${resume.analysis.skills.join(", ")}
        • Professional Summary: ${resume.analysis.summary}
        • Experience Highlights: ${resume.analysis.experience
          .slice(0, 3)
          .join(" | ")}
        • Education Background: ${resume.analysis.education.join(" | ")}
        `
            : ""
        }

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        💼 TARGET JOB POSITION:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Position Title: ${job.title}

        Job Description:
        ${job.description}

        Required Skills & Qualifications:
        ${job.skills.map((skill, i) => `${i + 1}. ${skill}`).join("\n")}

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        🎯 YOUR TASK:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        Perform a comprehensive job-resume compatibility analysis and return ONLY a valid JSON object (no markdown, no code blocks, no explanations).

        EXACT OUTPUT FORMAT:
        {
          "matchScore": 0,
          "missingSkills": [],
          "suggestedEdits": [],
          "aiSummary": ""
        }

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        📋 FIELD SPECIFICATIONS:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        1️⃣ "matchScore" (integer 0-100):
          Calculate using this weighted formula:

          A. SKILLS ALIGNMENT (40 points)
              • Hard skills match: Count exact or synonymous skills (25 pts)
              • Soft skills alignment: Leadership, communication, etc. (10 pts)
              • Tool/technology proficiency overlap (5 pts)

          B. EXPERIENCE RELEVANCE (30 points)
              • Years of experience vs. requirements (10 pts)
              • Industry/domain match (8 pts)
              • Role responsibilities alignment (7 pts)
              • Achievement quantification (5 pts)

          C. EDUCATION & CREDENTIALS (15 points)
              • Degree level match (8 pts)
              • Field of study relevance (4 pts)
              • Certifications & licenses (3 pts)

          D. OVERALL FIT (15 points)
              • Career progression trajectory (5 pts)
              • Cultural/role fit indicators (5 pts)
              • Resume quality & presentation (5 pts)

          SCORE INTERPRETATION (be realistic):
          • 90-100: Exceptional match - Top 5% candidate, nearly perfect fit
          • 80-89: Excellent match - Strong candidate, highly qualified
          • 70-79: Good match - Meets most requirements, competitive candidate
          • 60-69: Moderate match - Meets basic requirements, has potential
          • 50-59: Weak match - Significant gaps, requires training
          • 0-49: Poor match - Not qualified for this position

        2️⃣ "missingSkills" (array of strings):
          List ALL critical skills from the job requirements that are NOT found in the resume.
          • Include both hard and soft skills
          • Use exact terminology from job description
          • Prioritize by importance (most critical first)
          • If all skills are present, return empty array []
          • Maximum 10 skills

          Example: ["AWS Cloud Architecture", "Kubernetes", "Team Leadership", "Agile/Scrum"]

        3️⃣ "suggestedEdits" (array of strings):
          Provide 5-8 specific, actionable recommendations to improve resume-job fit:
          • Focus on high-impact changes first
          • Be specific with section names and content suggestions
          • Include keyword optimization tips
          • Suggest quantifiable achievements to add
          • Recommend reframing existing experience
          • Highlight what to emphasize or de-emphasize

          Format: Use imperative sentences, be concrete and actionable.
          
          Example: [
            "Add quantifiable metrics to your project management experience (e.g., 'Led team of X, delivered Y projects worth $Z')",
            "Expand the 'Technical Skills' section to prominently feature AWS, Docker, and CI/CD tools mentioned in job description",
            "Reframe your 'Software Developer' role to emphasize backend architecture and scalability achievements",
            "Include specific examples of cross-functional collaboration in the summary section",
            "Add certifications section highlighting AWS Solutions Architect and Kubernetes Administrator credentials",
            "Move your leadership experience higher in the resume to match the 'Team Lead' focus of this role"
          ]

        4️⃣ "aiSummary" (string, 150-250 words):
          Write a professional, comprehensive assessment covering:
          
          STRUCTURE (4 paragraphs):
          
          Paragraph 1 - OVERALL FIT (2-3 sentences):
          • Overall match quality and candidate suitability
          • Key strengths that make them a good fit
          
          Paragraph 2 - STRENGTHS & HIGHLIGHTS (3-4 sentences):
          • Specific skills, experiences, or achievements that align well
          • What makes this candidate stand out
          • Relevant accomplishments or credentials
          
          Paragraph 3 - GAPS & CONCERNS (2-3 sentences):
          • Critical missing skills or qualifications
          • Experience gaps or weaknesses
          • Areas that may require additional training or support
          
          Paragraph 4 - RECOMMENDATION (2-3 sentences):
          • Interview decision recommendation (Strong Yes / Yes / Maybe / No)
          • Specific areas to probe during interview
          • Final thoughts on candidate potential
          
          TONE: Professional, objective, balanced (not overly positive or negative)
          FORMAT: Clear prose, no bullet points in aiSummary

        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⚠️ CRITICAL RULES:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        ✓ Output MUST be valid, parseable JSON only
        ✓ NO markdown code blocks (\`\`\`json or \`\`\`)
        ✓ NO explanatory text before or after JSON
        ✓ NO additional fields beyond the 4 specified
        ✓ Be objective and realistic with scoring - most candidates score 60-80
        ✓ Base assessment ONLY on provided information
        ✓ Use exact skill names from job description in missingSkills
        ✓ Ensure suggestedEdits are specific and actionable
        ✓ aiSummary must be well-structured prose (not bullets)
        ✗ Do NOT inflate scores to be encouraging
        ✗ Do NOT invent qualifications not in resume
        ✗ Do NOT include comments in JSON
        ✗ Do NOT output anything except the JSON object

        BEGIN ANALYSIS NOW:`;

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

    // Log AI usage
    await incrementUsage(
      authSession.user.id,
      "match",
      `match resume with job: ${job.title}`,
      JSON.stringify(matchData),
      "llama-3.3-70b-versatile",
      completion.usage?.total_tokens
    );

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
