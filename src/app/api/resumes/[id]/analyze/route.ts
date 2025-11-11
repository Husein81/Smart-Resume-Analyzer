import { groq } from "@/lib/groq";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/middleware";

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

    const prompt = `You are an expert ATS (Applicant Tracking System) and resume analyzer. 
        Analyze the following resume and provide a comprehensive evaluation.

        ${
          jobDescription
            ? `Job Description (for context):\n${jobDescription}\n\n`
            : ""
        }

        Resume Text:
        ${resume.parsedText}

        Return ONLY a valid JSON object (no markdown, no code blocks) with these exact fields:
        {
          "summary": "A 2-3 sentence professional summary of the candidate",
          "skills": ["skill1", "skill2", "skill3"],
          "experience": ["job title at company (duration)", "key achievement"],
          "education": ["degree name from institution", "certification"],
          "score": 75
        }

        The score should be 0-100 based on:
        - Resume completeness and clarity (30%)
        - Skills relevance and depth (25%)
        - Experience quality and achievements (25%)
        - Education and certifications (10%)
        - ATS compatibility (10%)

        Be honest with scoring. A score of 60-70 is average, 70-80 is good, 80-90 is excellent, 90+ is exceptional.`;

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
