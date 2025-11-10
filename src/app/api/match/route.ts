import { groq } from "@/lib/groq";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { resumeId, jobId } = await req.json();

    const [resume, job] = await Promise.all([
      prisma.resume.findUnique({ where: { id: resumeId } }),
      prisma.jobDescription.findUnique({ where: { id: jobId } }),
    ]);

    if (!resume || !job)
      return NextResponse.json(
        { error: "Invalid resume or job ID" },
        { status: 400 }
      );

    const prompt = `
      Compare the resume with the job description below.
      Return JSON with:
      - matchScore (0–100)
      - missingSkills (array)
      - suggestedEdits (array)
      - aiSummary (string)

      Resume:
      ${resume.parsedText}

      Job Description:
      ${job.description}
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const aiText = completion.choices[0]?.message?.content;
    const matchData = JSON.parse(aiText || "{}");

    const match = await prisma.matchResult.create({
      data: {
        resumeId,
        jobDescriptionId: jobId,
        ...matchData,
      },
    });

    return NextResponse.json({ success: true, match });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to match resume and job" },
      { status: 500 }
    );
  }
}
